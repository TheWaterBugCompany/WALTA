
function decodeSyslog(line) {
    if ( ! line  )
        return "";
    return line.replace(/\u005c\u0031\u0033\u0034\u005e\u005b/g,'\u001b');
}

exports.decodeSyslog = decodeSyslog;