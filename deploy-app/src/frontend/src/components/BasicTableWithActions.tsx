import { TableContainer, Paper, Table, TableHead, TableCell, TableBody, TableRow } from "@mui/material";

interface BasicTableWithActionsProps {
    columns: any[];
    rows: any[];
    keyColumn: string;
    actionColumn?: (row: any) => JSX.Element;
};

const BasicTableWithActions = ({ columns, rows, keyColumn, actionColumn }: BasicTableWithActionsProps) => {
    const getNestedValue = (row: any, field: string) => {
        // Split the field by dot notation to access nested properties
        const keys = field.split('.');
        let value = row;
        for (let key of keys) {
            if (value[key]) {
                value = value[key];
            } else {
                return null; // or a default value if necessary
            }
        }
        return value;
    };

    return (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        {columns.map((column) => (
                            <TableCell key={column.label}>{column.label}</TableCell>
                        ))}
                        {actionColumn && <TableCell>Actions</TableCell>}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {rows.map((row) => (
                        <TableRow key={row[keyColumn]}>
                            {columns.map((column) => (
                                <TableCell key={column.field}>{getNestedValue(row, column.field)}</TableCell>
                            ))}
                            {actionColumn && (
                                <TableCell>
                                    {actionColumn(row)}
                                </TableCell>
                            )}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default BasicTableWithActions;
