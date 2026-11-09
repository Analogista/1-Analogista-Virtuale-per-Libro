const fs = require('fs');

const testFiles = [
    'src/screens/TestInduttore.tsx',
    'src/screens/TestNome.tsx',
    'src/screens/TestimoneChiave.tsx',
    'src/screens/TestPuntiDistonici.tsx',
    'src/screens/CalcolaTimeLine.tsx',
    'src/screens/TestSigilliVincoli.tsx',
    'src/screens/CalibrazioneScreen.tsx',
    'src/screens/QualeGiorno.tsx',
    'src/screens/PercorsoCompleto.tsx'
];

testFiles.forEach(file => {
    let code = fs.readFileSync(file, 'utf8');

    // Remove state
    code = code.replace(/const \[isPaused, setIsPaused\] = useState\(false\);\n?/g, '');
    code = code.replace(/const handlePause = \(\) => {[\s\S]*?};\n?/g, '');
    code = code.replace(/const handleResume = \(\) => {[\s\S]*?};\n?/g, '');
    
    // Remove setIsPaused calls
    code = code.replace(/setIsPaused\(true\);\n?/g, '');
    code = code.replace(/setIsPaused\(false\);\n?/g, '');
    code = code.replace(/setIsPaused\(.*\);\n?/g, '');

    // Remove !isPaused from conditions
    code = code.replace(/ && !isPaused/g, '');
    code = code.replace(/\!isPaused \? /g, ''); // Fix ternary if any
    code = code.replace(/\? \(\n\s*<TestControls/g, '&&\n(<TestControls');

    // Remove props from TestControls
    code = code.replace(/isPaused={isPaused}\n?/g, '');
    code = code.replace(/onPause={handlePause}\n?/g, '');
    code = code.replace(/onResume={handleResume}\n?/g, '');

    fs.writeFileSync(file, code);
});
