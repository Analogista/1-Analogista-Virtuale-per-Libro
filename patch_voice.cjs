const fs = require('fs');
let code = fs.readFileSync('src/services/AdvancedVoiceService.ts', 'utf8');

// Add activeRejects array
code = code.replace(
    'private currentPromptForRedetection: string | null = null;',
    'private currentPromptForRedetection: string | null = null;\n    private activeRejects: Array<(reason?: any) => void> = [];'
);

// Reject all promises in cancel
code = code.replace(
    'public cancel() {',
    `public cancel() {
        this.activeRejects.forEach(reject => reject(new Error("CANCELLED")));
        this.activeRejects = [];`
);

// Modify askQuestion to store reject
code = code.replace(
    /askQuestion\(question: string, userName = ''\): Promise<AutomatedResponse> {\n        return new Promise\(\(resolve\) => {/g,
    `askQuestion(question: string, userName = ''): Promise<AutomatedResponse> {
        return new Promise((resolve, reject) => {
            this.activeRejects.push(reject);`
);

// Resolve removes reject
code = code.replace(
    /resolve\('NON_RILEVATO'\);/g,
    `resolve('NON_RILEVATO');
                this.activeRejects = this.activeRejects.filter(r => r !== reject);`
);

code = code.replace(
    /resolve\(response\);/g,
    `resolve(response);
                this.activeRejects = this.activeRejects.filter(r => r !== reject);`
);


// Modify speak to store reject
code = code.replace(
    /async speak\(text: string\): Promise<void> {\n        return new Promise\(\(resolve\) => {/g,
    `async speak(text: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.activeRejects.push(reject);`
);

// Add clear reject to resolve() inside speak (we need to be careful with replace)
code = code.replace(
    /if \(!this.isPaused\) resolve\(\);/g,
    `if (!this.isPaused) {
                                    resolve();
                                    this.activeRejects = this.activeRejects.filter(r => r !== reject);
                                }`
);

fs.writeFileSync('src/services/AdvancedVoiceService.ts', code);
