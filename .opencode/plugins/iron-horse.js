import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function extractAndStripFrontmatter(content) {
  // strip YAML frontmatter between --- delimiters
  return content.replace(/^---[\s\S]*?---\n/, '');
}

function getBootstrapContent() {
  const skillPath = join(__dirname, '../../skills/using-iron-horse/SKILL.md');
  const raw = readFileSync(skillPath, 'utf8');
  return extractAndStripFrontmatter(raw);
}

export default function IronHorsePlugin({ client, directory }) {
  return {
    experimental: {
      chat: {
        system: {
          transform: async (output) => {
            const content = getBootstrapContent();
            (output.system ||= []).push({ type: 'text', text: content });
            return output;
          }
        }
      }
    }
  };
}
