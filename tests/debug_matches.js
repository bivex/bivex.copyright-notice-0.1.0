// Debug the matchesPattern function
function matchesPattern(fileName, pattern) {
    // Simple glob pattern matching - build regex more carefully
    let regexStr = '^';

    for (let i = 0; i < pattern.length; i++) {
        const char = pattern[i];
        switch (char) {
            case '*':
                regexStr += '.*';
                break;
            case '?':
                regexStr += '.';
                break;
            case '.':
            case '[':
            case ']':
            case '(':
            case ')':
            case '{':
            case '}':
            case '^':
            case '$':
            case '+':
            case '|':
            case '\\':
                regexStr += '\\' + char;
                break;
            default:
                regexStr += char;
        }
    }

    regexStr += '$';
    const regex = new RegExp(regexStr, 'i');
    const match = regex.test(fileName);
    console.log(`Pattern: "${pattern}" -> Regex: ${regexStr} -> File: "${fileName}" -> Match: ${match}`);
    return match;
}

console.log('Testing matchesPattern function:');
console.log('Test 1:', matchesPattern('test.min.js', '*.min.js'));
console.log('Test 2:', matchesPattern('node_modules/pkg.json', 'node_modules/**'));
console.log('Test 3:', matchesPattern('test.js', '*.min.js'));