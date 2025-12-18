const fs = require('fs');
const path = require('path');

console.log('🧪 Manual Test for Apply to All Files Functionality\n');

// Check if test files exist and don't have copyright
const testDir = 'test_apply_all_files';

if (!fs.existsSync(testDir)) {
    console.log('❌ Test directory not found. Creating test files...');

    // Create test directory
    fs.mkdirSync(testDir, { recursive: true });

    // Create test files
    const testFiles = [
        {
            name: 'test1.js',
            content: '// Test file 1 - simple JavaScript without copyright\nfunction helloWorld() {\n    console.log("Hello, World!");\n    return "success";\n}\n\nhelloWorld();'
        },
        {
            name: 'test2.py',
            content: '# Test file 2 - Python file without copyright\ndef calculate_sum(a, b):\n    """Calculate sum of two numbers"""\n    result = a + b\n    print(f"Sum of {a} and {b} is {result}")\n    return result\n\nif __name__ == "__main__":\n    calculate_sum(5, 3)'
        },
        {
            name: 'test3.ts',
            content: '// Test file 3 - TypeScript without copyright\ninterface User {\n    name: string;\n    age: number;\n}\n\nclass UserManager {\n    private users: User[] = [];\n\n    addUser(user: User): void {\n        this.users.push(user);\n        console.log(`Added user: ${user.name}`);\n    }\n\n    getUsers(): User[] {\n        return this.users;\n    }\n}\n\nconst manager = new UserManager();\nmanager.addUser({ name: "Alice", age: 30 });'
        },
        {
            name: 'test4.html',
            content: '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Test Page</title>\n</head>\n<body>\n    <h1>Test HTML Page</h1>\n    <p>This is a test page without copyright notice.</p>\n    <script>\n        console.log("Page loaded");\n    </script>\n</body>\n</html>'
        }
    ];

    testFiles.forEach(file => {
        const filePath = path.join(testDir, file.name);
        fs.writeFileSync(filePath, file.content);
        console.log(`✅ Created ${file.name}`);
    });

    console.log('\n📁 Test files created successfully!');
    console.log('Now run the "Apply Copyright Notice to All Files in Project" command from VS Code.');
    console.log('Then run this script again to verify the results.\n');

} else {
    console.log('📁 Test directory found. Checking for copyright notices...\n');

    const testFiles = ['test1.js', 'test2.py', 'test3.ts', 'test4.html'];
    let processed = 0;
    let hasCopyright = 0;

    testFiles.forEach(fileName => {
        const filePath = path.join(testDir, fileName);

        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            const hasCopyrightNotice = content.includes('Copyright') || content.includes('2025');

            console.log(`${hasCopyrightNotice ? '✅' : '❌'} ${fileName}: ${hasCopyrightNotice ? 'Has copyright' : 'No copyright'}`);

            processed++;
            if (hasCopyrightNotice) {
                hasCopyright++;
            }
        } else {
            console.log(`❌ ${fileName}: File not found`);
        }
    });

    console.log(`\n📊 Results: ${hasCopyright}/${processed} files have copyright notices`);

    if (hasCopyright === processed) {
        console.log('🎉 All test files have copyright notices! Test PASSED.');
    } else if (hasCopyright > 0) {
        console.log('⚠️  Some files have copyright notices. Test PARTIAL.');
    } else {
        console.log('❌ No files have copyright notices. Test FAILED.');
    }

    console.log('\n💡 To clean up: delete the "test_apply_all_files" directory');
}