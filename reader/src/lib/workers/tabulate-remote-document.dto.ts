import { DocumentViewDto } from '../../../../server/src/documents/document-view.dto'

export type TabulateRemoteDocumentDto = {
    notableSubsequences: string[]
    words: string[]
    d: DocumentViewDto
    language_code: string
}