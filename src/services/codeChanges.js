const { ipcRenderer } = window.require('electron');

// XML parsing utilities
const parseXML = (xmlString) => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
    return xmlDoc;
};

const getNodeText = (node, tagName) => {
    const element = node.getElementsByTagName(tagName)[0];
    return element ? element.textContent.trim() : '';
};

// Main code changes service
export const codeChanges = {
    async applyChanges(xmlString) {
        try {
            const xmlDoc = parseXML(xmlString);
            // Get all file nodes under changed_files
            const changedFiles = xmlDoc.querySelector('changed_files').getElementsByTagName('file');

            const changes = [];
            for (const fileNode of changedFiles) {
                const change = {
                    summary: getNodeText(fileNode, 'file_summary'),
                    operation: getNodeText(fileNode, 'file_operation'),
                    path: getNodeText(fileNode, 'file_path'),
                    // Extract CDATA content properly
                    code: fileNode.querySelector('file_code')?.firstChild?.data?.trim() || ''
                };
                changes.push(change);
            }

            // Send changes to main process for application
            const result = await ipcRenderer.invoke('apply-code-changes', changes);
            return result;
        } catch (error) {
            console.error('Error applying code changes:', error);
            throw error;
        }
    }
};