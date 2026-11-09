const fs = require('fs');
let code = fs.readFileSync('src/components/CameraView.tsx', 'utf8');

code = code.replace(
    'setIsCalibrating(true);',
    'setIsCalibrating(true);\n    motionService.current?.stopDetection();'
);

code = code.replace(
    'motionService.current?.calibrate();',
    'motionService.current?.startDetection();\n            motionService.current?.calibrate();'
);

fs.writeFileSync('src/components/CameraView.tsx', code);
