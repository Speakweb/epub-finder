import { TableCell, TableHead, TableRow} from "@material-ui/core";
import React from "react";

export const LibraryTableHead: React.FC<{}> = () => {
    return <TableHead>
        <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Use for Frequency</TableCell>
            <TableCell>Use for Reading</TableCell>
        </TableRow>
    </TableHead>
}