import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function stripFrontmatter(content) {
  return content.replace(/^---[\s\S]*?---\n/, '');
}

function getBootstrapContent() {
  const skillPath = join(__dirname, 'skills', 'using-iron-horse', 'SKILL.md');
  const raw = readFileSync(skillPath, 'utf8');
  return stripFrontmatter(raw);
}

export default function IronHorsePlugin({ client, directory }) {
  return {
    name: 'iron-horse',
    hooks: {
      'experimental.chat.system.transform': async (input, output) => {
        const content = getBootstrapContent();
        output.system.push(content);
      },
    },
  };
}
