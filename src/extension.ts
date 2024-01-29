// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";

let myStatusBarItem: vscode.StatusBarItem;
const statusBarStrings: StatusBarStrings = {};
const defaultStatusBarString: StatusBarStrings = {
    activeString: "Ln $line, Col $col",
    selectionString: "Ln $line, Col $col ($selLines lines, $selChars)",
    multiActiveString: "$mulLines selections",
    multiSelectionString: "$mulLines selections ($selChars chars)",
};

type StatusBarStrings = {
    activeString?: string;
    selectionString?: string;
    multiActiveString?: string;
    multiSelectionString?: string;
};

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    const myCommand = "bsc.showSelection";

    // let command = vscode.commands.registerCommand(myCommand, () => {
    // 	vscode.window.showInformationMessage("Command init");
    // });

    // context.subscriptions.push(vscode.commands.registerCommand("bsc.helloWorld", () => {
    //     vscode.window.showInformationMessage("Hello World!");
    // }))

    // context.subscriptions.push(command);

    const ib = vscode.window.createInputBox();

    context.subscriptions.push(
        vscode.commands.registerCommand("bsc.set", () => {
            ib.title = "";
            ib.show();
            ib.onDidAccept(() => {
                ib.validationMessage = "Hallo";
                ib.hide();
            });
        })
    );

    // context.subscriptions.push();

    context.subscriptions.push(
        vscode.commands.registerCommand(myCommand, () => {
            vscode.window.showInformationMessage("Show Selection");
        })
    );

    myStatusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right,
        10000
    );
    myStatusBarItem.command = myCommand;

    context.subscriptions.push(myStatusBarItem);

    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(updateStatusBarItem));

    context.subscriptions.push(
        vscode.window.onDidChangeTextEditorSelection(updateStatusBarItem)
    );

    updateStatusBarItem();

    // context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}

function replaceValues(
    stringToReplace: string,
    lines: number,
    chars: number,
    cursorCount: number,
    cursor: { line: number; column: number }
): string {
    return stringToReplace
        .replaceAll("$line", cursor.line.toString())
        .replaceAll("$col", cursor.column.toString())
        .replaceAll("$selChars", chars.toString())
        .replaceAll("$selLines", lines.toString())
        .replaceAll("$mulLines", cursorCount.toString());
}

function updateStatusBarItem(): void {
    const lines = getNumberOfSelectedLines(vscode.window.activeTextEditor);
    const chars = getNumberOfSelectedChars(vscode.window.activeTextEditor);
    const cursorCount = getCursorCount(vscode.window.activeTextEditor);
    const cursor = getCursorPos(vscode.window.activeTextEditor);

    const statusBarStr = getStatusBarString(lines, chars, cursorCount, cursor);
    if (statusBarStr) {
        myStatusBarItem.text = statusBarStr;
        myStatusBarItem.tooltip = statusBarStr;
        myStatusBarItem.show();
    } else myStatusBarItem.hide();
}

function getStatusBarString(
    lines: number,
    chars: number,
    cursorCount: number,
    cursor: { line: number; column: number } | null,
    statusBarStrings?: StatusBarStrings
): string | null {
    if (!cursor) {
        return null;
    }

    // if (statusBarStrings) {
    //     if ((lines === 0 || chars === 0)) {
    //         return
    //     }else if (cursorCount < 2 && statusBarStrings.selectionString) {
    //         return replaceValues(statusBarStrings.selectionString, lines, chars, cursorCount, cursor);
    //     } else if (cursorCount < 2 && statusBarStrings.multiSelectionString) {
    //         return replaceValues(statusBarStrings.multiSelectionString, lines, chars, cursorCount, cursor);
    //     }
    // }

    let returnStr = "";
    if (cursorCount < 2) {
        // const selection = `(${lines} lines, ${chars} chars)`;
        // returnStr = `Ln ${cursor.line}, Col ${cursor.column}${
        //     lines === 0 || chars === 0 ? "" : " " + selection
        // }`;
        if (lines === 0 || chars === 0) {
            returnStr = replaceValues(
                statusBarStrings?.activeString ?? defaultStatusBarString.activeString!,
                lines,
                chars,
                cursorCount,
                cursor
            );
        } else {
            returnStr = replaceValues(
                statusBarStrings?.selectionString ?? defaultStatusBarString.selectionString!,
                lines,
                chars,
                cursorCount,
                cursor
            );
        }
    } else {
        if (chars === 0) {
            returnStr = replaceValues(
                statusBarStrings?.multiActiveString ??
                    defaultStatusBarString.multiActiveString!,
                lines,
                chars,
                cursorCount,
                cursor
            );
        } else {
            returnStr = replaceValues(
                statusBarStrings?.multiSelectionString ??
                    defaultStatusBarString.multiSelectionString!,
                lines,
                chars,
                cursorCount,
                cursor
            );
        }
        // const selection = `(${chars} chars)`;
        // returnStr = `${cursorCount} selections${chars === 0 ? "" : " " + selection}`;
    }

    return returnStr;
}

function getCursorPos(
    editor: vscode.TextEditor | undefined
): { line: number; column: number } | null {
    if (editor) {
        return {
            line: editor.selection.active.line + 1,
            column: editor.selection.active.character + 1,
        };
    } else return null;
}

function getCursorCount(editor: vscode.TextEditor | undefined): number {
    if (editor) {
        return editor.selections.length;
    } else return 0;
}

function getNumberOfSelectedChars(editor: vscode.TextEditor | undefined): number {
    let chars = 0;
    if (editor) {
        for (let selection of editor.selections) {
            let start = selection.start;
            let end = selection.end;
            if (start.line === end.line) {
                chars += end.character - start.character;
            } else {
                let firstLineChars =
                    editor.document.lineAt(start.line).text.length - start.character;
                let lastLineChars = end.character;
                let middleLinesChars = 0;
                for (let i = start.line + 1; i < end.line; i++) {
                    middleLinesChars += editor.document.lineAt(i).text.length;
                }
                chars += firstLineChars + middleLinesChars + lastLineChars;
            }
        }
    }
    return chars;
}

function getNumberOfSelectedLines(editor: vscode.TextEditor | undefined): number {
    let lines = 0;
    if (editor) {
        lines = editor.selections.reduce(
            (prev, curr) => prev + (curr.end.line - curr.start.line),
            1
        );
    }
    return lines;
}
