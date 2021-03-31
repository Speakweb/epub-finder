import {Test} from '@nestjs/testing';
import {TabulateService} from "../src/documents/similarity/tabulate.service";
import {DocumentsModule} from "../src/documents/documents.module";
import {TypeOrmModule} from "@nestjs/typeorm";
import {Document} from "../src/entities/document.entity";
import {DocumentView} from "../src/entities/document-view.entity";
import {User} from "../src/entities/user.entity";
import {DatabaseModule} from "../src/config/database.module";
import {wordsFromCountRecordList} from "../src/shared/tabulation/word-count-records.module";
import {AtomizedDocument, InterpolateService, tabulate} from "../src/shared";
import {ChineseVocabService} from "../src/shared/tabulate-documents/chinese-vocab.service";
import {SetWithUniqueLengths} from "../src/shared/tabulate-documents/set-with-unique-lengths";
import {chineseCharacterRegexp} from "../src/shared/OldAnkiClasses/Card";

const tabulateHtml3 = async (tabulateService: TabulateService) => await tabulateService.tabulateNoCache(
    {where: {name: "Test Html 3 Sentences"}},
    [
        '你好',
        '你',
        '好',
        '今',
        '天',
        '今天',
        '之',
        '所以',
        '所',
        '以',
        '搞出',
        '出',
        '搞',
        '这么多',
        '大',
        '内乱',
        '内',
        '乱',
        '原因',
        '主要',
        '主',
        '要',
        '这几点',
        '这',
        '几点',
    ]
);

async function tabulateChineseSentence(chineseSegment: string) {
    const chineseVocabSet = new SetWithUniqueLengths(await ChineseVocabService.vocab());
    return tabulate(
        {
            notableCharacterSequences: chineseVocabSet,
            segments: AtomizedDocument.atomizeDocument(
                InterpolateService.sentences([
                    chineseSegment
                ])
            ).segments(),
            greedyWordSet: chineseVocabSet,
            isNotableCharacterRegexString: chineseCharacterRegexp.toString(),
            isWordBoundaryRegexString: "//",
            wordIdentifyingStrategy: undefined
        }
    );
}

describe('document tabulation', () => {
    let tabulateService: TabulateService;
    beforeEach(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [
                DatabaseModule,
                TypeOrmModule.forFeature([Document, DocumentView, User]),
                DocumentsModule
            ],

        }).compile();

        tabulateService = moduleRef.get<TabulateService>(TabulateService);
    });
    it('tabulates Simplified Chinese documents',
        async () => {
            const tabulation = await tabulateService.tabulate(
                {where: {name: "Test Html"}},
                ['今天', '今', '天']
            );
            expect(tabulation.wordCounts).toMatchObject({'今天': 1, '今': 1, '天': 1});
        }
    );
    it(
        'Greedily tabulates documents', async () => {
            const tabulation = await tabulateService.tabulateNoCache(
                {where: {name: "Test Html"}},
                ['你好', '你', '好']
            );
            expect(tabulation.greedyWordCounts.get('你好')).toBe(1);
            expect(tabulation.greedyWordCounts.get('你')).toBeFalsy()
        }
    );
    it('Calculates regular word counts, greedy work counts, cross segment counting', async () => {
        const tabulation = await tabulateHtml3(tabulateService);
        expect(tabulation.greedyWordCounts.get('你好')).toBe(2);
        expect(tabulation.greedyWordCounts.get('今天')).toBe(2);
        expect(tabulation.wordCounts).toEqual({
            "你好": 2,
            "你": 2,
            "好": 2,
            "今天": 2,
            "今": 2,
            "天": 2
        });
    });
    it('Counts word records', async () => {
        const tabulation = await tabulateHtml3(tabulateService);
        // @ts-ignore
        const segmentWord = [...tabulation.segmentWordCountRecordsMap.values()];
        const countRecords = wordsFromCountRecordList(
            segmentWord[segmentWord.length - 1]
        );
        expect(countRecords).toHaveLength(9)
    });
    it('tabulates sentences with vocab' ,async () => {
        const tabulation3 = await tabulateChineseSentence("楚文王在鬻拳的苦谏下，决定放蔡哀侯归国。");
        // @ts-ignore
        expect([...tabulation3.segmentWordCountRecordsMap.values()][0]) .toHaveLength(26);
        const tabulation = await tabulateChineseSentence("让安禄山兼任平卢、范阳、河东三镇节度使，就属于 唐玄宗制度上的错误。");
        // @ts-ignore
        expect([...tabulation.segmentWordCountRecordsMap.values()][0]) .toHaveLength(26);
        const tabulation2 = await tabulateChineseSentence("陛下为何要爱惜此人，而亏损王法呢");
        // @ts-ignore
        expect([...tabulation2.segmentWordCountRecordsMap.values()][0]) .toHaveLength(13);
    })
})