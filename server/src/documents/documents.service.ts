import {User} from "../entities/user.entity";
import {Document} from "../entities/document.entity";
import {DocumentView} from "../entities/document-view.entity";
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";
import {basename} from "path";
import {HashService} from "./uploading/hash.service";

function CannotFindDocumentForUser(documentIdToDelete: string, user: User) {
    return new Error(`Cannot find existing document with id ${documentIdToDelete} which belongs to user ${user.id}`);
}

export class DocumentsService {
    constructor(
        @InjectRepository(DocumentView)
        private documentViewRepository: Repository<DocumentView>,
        @InjectRepository(Document)
        private documentRepository: Repository<Document>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) {
    }

    async all({user, for_testing}:{user?: User | undefined, for_testing?: boolean}): Promise<DocumentView[]> {
        return await this.documentViewRepository
            .find({
                    where: [
                        {creator_id: user?.id, deleted: false},
                        {deleted: false, for_testing: for_testing},
                    ]
                }
            )
    }

    public async saveRevision(user: User, name: string, filePath: string, documentId: string) {
        if (!await this.belongsToUser(user, documentId)) {
            throw CannotFindDocumentForUser(documentId, user);
        }
        return await this.documentRepository.save({
            document_id: documentId,
            name,
            filename: basename(filePath),
            hash: await HashService.hashS3(filePath),
            creator_id: user.id,
            global: false
        })
    }

    public async saveNew(user: User, name: string, filePath: string) {

        return await this.documentRepository.save({
            name,
            filename: basename(filePath),
            hash: await HashService.hashS3(filePath),
            creator_id: user.id,
            global: false
        })
    }

    public async delete(user: User, documentId: string) {
        const existing = await this.existing(user, documentId);
        const deletingId = existing.rootId()
        delete existing.id;
        delete existing.created_at;
        return await this.documentRepository.save({
            ...existing,
            document_id: deletingId,
            deleted: true
        })
    }

    /**
     * Returns an existing document by document_id/id belonging to a user
     * Or throws an error if it cannot find it
     * @param user
     * @param documentIdToDelete
     * @private
     */
    private async existing(user: User, documentIdToDelete: string) {
        const existingDocument = await this.byDocumentId(user, documentIdToDelete);
        if (!existingDocument) {
            throw CannotFindDocumentForUser(documentIdToDelete, user)
        }
        return existingDocument;
    }

    private async byDocumentId(user: User, documentId: string) {
        return await this.documentViewRepository.findOne({
            where: [
                {
                    creator_id: user.id,
                    document_id: documentId
                },
                {
                    creator_id: user.id,
                    id: documentId
                }
            ]
        });
    }

    private async belongsToUser(user, document_id) {
        return !!await this.byDocumentId(user, document_id);
    }

    public async byFilename({filename, user}:{filename: string, user?: User}) {
        const whereConditions: Partial<DocumentView>[] = [
            {
                global: true,
                filename
            },
            {
                for_testing: true,
                filename
            }
        ]
        if (user) {
            whereConditions.push(
                {
                    creator_id: user.id,
                    filename
                },
            )
        }
        return await this.documentViewRepository.findOne({
            where: whereConditions
        });
    }
    public async byName(name: string, user: User) {
        return await this.documentViewRepository.findOne({
            name,
            creator_id: user.id
        });
    }
}