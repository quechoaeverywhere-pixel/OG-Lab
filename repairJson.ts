export function repairJson(str: string): string {
    if (!str || str.trim() === '') return '{}';
    try {
        JSON.parse(str);
        return str;
    } catch (e) {}

    let repaired = str;
    let inString = false;
    let escape = false;
    for (let i = 0; i < repaired.length; i++) {
        const char = repaired[i];
        if (char === '\\' && !escape) {
            escape = true;
        } else {
            if (char === '"' && !escape) {
                inString = !inString;
            }
            escape = false;
        }
    }

    if (inString) {
        repaired += '"';
    }

    const stack: string[] = [];
    inString = false;
    escape = false;
    for (let i = 0; i < repaired.length; i++) {
        const char = repaired[i];
        if (char === '\\' && !escape) {
            escape = true;
        } else {
            if (char === '"' && !escape) {
                inString = !inString;
            } else if (!inString) {
                if (char === '{' || char === '[') {
                    stack.push(char);
                } else if (char === '}') {
                    if (stack[stack.length - 1] === '{') stack.pop();
                } else if (char === ']') {
                    if (stack[stack.length - 1] === '[') stack.pop();
                }
            }
            escape = false;
        }
    }

    while (stack.length > 0) {
        const char = stack.pop();
        if (char === '{') repaired += '}';
        else if (char === '[') repaired += ']';
    }

    try {
        JSON.parse(repaired);
        return repaired;
    } catch(e) {
        return '{}';
    }
}
