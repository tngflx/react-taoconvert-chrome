import { createFilter } from '@rollup/pluginutils';
import type { OutputChunk } from 'rollup';
import type { PluginOption } from 'vite';
import * as fs from 'fs';
import * as path from 'path';

interface removeVitePreloadImport {
    include: string | string[];
    exclude?: string | string[];
}

export default function removeVitePreloadImport(options: removeVitePreloadImport): PluginOption {
    const filter = createFilter(options.include, options.exclude);

    return {
        name: 'remove-vite-preload-import',
        async writeBundle(outputOptions, bundle) {
            const outputDir = outputOptions.dir || (outputOptions.file && path.dirname(outputOptions.file));
            let fileToDelete: string | null = null;

            if (!outputDir) {
                console.error('Unable to determine the output directory.');
                return;
            }

            for (const [fileName, outputChunk ] of Object.entries(bundle) as [string, OutputChunk][]) {
                if (!filter(fileName)) {
                    continue; // Skip files that don't match the filter
                }

                let modifiedCode = outputChunk.code;

                // Check if the filename contains "index.js"
                if (fileName.includes('index.js')) {
                    // Replace import statements with the actual code
                    const importStatementRegex = /import\s*\{[^\}]*__vitePreload[^\}]*\}\s*from\s*['"]([^'"]+)['"];/g;
                    const exportStatementRegex = /export\s*\{\s*__vitePreload\s*as\s*_\s*\};/g;

                    modifiedCode = modifiedCode.replace(importStatementRegex, (_, relativePath) => {
                        const absolutePath = path.resolve(outputDir, path.dirname(fileName), relativePath);

                        try {
                            let fileContent = fs.readFileSync(absolutePath, 'utf-8');
                            fileContent = fileContent.replace(exportStatementRegex, '');
                            return fileContent;

                        } catch (error) {
                            console.error(`Error reading file: ${absolutePath}`, error);
                            return _; // Return the original import statement if there is an error
                        }finally {
                            // Store the file path for deletion outside the loop
                            fileToDelete = absolutePath;
                        }
                    })
                }
                
                try {
                    fs.writeFileSync(path.resolve(outputDir, fileName), modifiedCode, 'utf-8');
                } catch (error) {
                    console.error(`Error writing file: ${path.resolve(outputDir, fileName)}`, error);
                }

            }

            if (fileToDelete) {
                try {
                    fs.unlinkSync(fileToDelete);
                } catch (error) {
                    console.error(`Error removing file: ${fileToDelete}`, error);
                }
            }
        },
    };
};

