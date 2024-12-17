import { encode } from 'gpt-tokenizer';

export const countTokens = (text) => {
    try {
        const tokens = encode(text);
        console.log('Counted tokens:', tokens.length);
        return tokens.length;
    } catch (error) {
        console.error('Error counting tokens:', error);
        return 0;
    }
};

export const countFileTokens = async (filePath, fs, path, currentPath) => {
    try {
        const fullPath = path.join(currentPath, filePath);
        const content = await fs.readFile(fullPath, 'utf-8');
        const tokenCount = countTokens(content);
        return tokenCount;
    } catch (error) {
        console.error('Error reading file for token count:', error);
        return 0;
    }
};