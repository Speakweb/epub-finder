import {ManagerContext} from "../../App";
import React, {useContext} from "react";
import {Table, TableContainer, TableHead, TableRow, TableCell, Paper, TableBody} from "@material-ui/core";
import {useObservableState} from "observable-hooks";
import {last5} from "./last-n";



export const QuizCardTableComponent = () => {
    const m = useContext(ManagerContext);
    const scheduleRows = useObservableState(
        m.scheduleManager.sortedScheduleRows$
    ) || [];
    return <TableContainer component={Paper}>
        <Table aria-label="simple table">
            <TableHead>
                <TableRow>
                    <TableCell style={{minWidth: '10em'}}>Word</TableCell>
                    <TableCell align="right">Recognition</TableCell>
                    <TableCell align="right">Word Counts</TableCell>
                    <TableCell align="right">Pronunciation Records</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {scheduleRows.map(row => (
                    <TableRow key={row.word}>
                        <TableCell component="th" scope="row"> {row.word} </TableCell>
                        <TableCell align="right">{
                            last5(row.wordRecognitionRecords)
                                .map(r => `${r.timestamp} ${r.recognitionScore}`)
                                .join(',')
                        }
                        </TableCell>
                        <TableCell align="right">{
                            last5(row.wordCountRecords)
                                .map(r => `${r.document} ${r.count}`)
                                .join(',')
                        }</TableCell>
                        <TableCell align="right">{
                            last5(row.pronunciationRecords)
                                .map(r => `${r.timestamp} ${r.success ? 'Correct' : 'Incorrect'}`)
                                .join(',')
                        }</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    </TableContainer>
}