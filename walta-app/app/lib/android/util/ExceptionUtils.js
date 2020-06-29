exports.parseStackTrace = function(stackString) {
    const parseStack = /^\s+at\s+([^\s]+)\s+\(([^\n]+)\)$/mg;
    const parseLineNo = /^(.+):(\d+):(\d+)$/;
    let stack = [];
    let tmp;
    while( tmp = parseStack.exec(stackString) ) {
        let [,symbol,source] = tmp;
        if ( parseLineNo.test(source) ) {
            let [,file,line,column] = parseLineNo.exec(source);
            stack.push({ symbol: symbol, file: file, line: parseInt(line), column: parseInt(column) });
        } else {
            stack.push({ symbol: symbol, file: source })
        }
    }
    return stack;
}