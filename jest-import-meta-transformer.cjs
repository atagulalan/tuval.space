// Custom transformer to handle import.meta in Jest
const ts = require('typescript');

module.exports = {
  process(sourceText, sourcePath, config, transformOptions) {
    // Replace import.meta.env with globalThis.import.meta.env
    const transformed = sourceText.replace(
      /import\.meta\.env(\.\w+)?/g,
      (match, prop) => {
        if (prop) {
          return `globalThis.import.meta.env${prop}`;
        }
        return 'globalThis.import.meta.env';
      }
    );
    
    // Use ts-jest to process the transformed code
    const tsJest = require('ts-jest').default;
    const transformer = tsJest.createTransformer();
    return transformer.process(transformed, sourcePath, config, transformOptions);
  },
};

