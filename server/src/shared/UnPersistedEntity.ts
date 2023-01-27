export type UnPersistedEntity<T> = Omit<T, "id"> & {id: number | null};
