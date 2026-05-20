import fs from 'fs';

const content = fs.readFileSync('src/App.tsx', 'utf8');

// Let's parse JSX tags inside the bank_soal tab (lines 3807 to 4887)
console.log('--- Debugging JSX tags ---');

// We will track tags like <div>, </div>, <motion.div>, etc.
const lines = content.split('\n');

const tagRegex = /<\/?[a-zA-Z0-9\._:-]+(?:\s+[a-zA-Z0-9\._:-]+(?:=(?:(?:"[^"]*")|(?:'[^']*')|(?:{[^}]*})))*)*\s*\/?>|<\/?[a-zA-Z0-9\._:-]+>/g;

let stack = [];

// Let's filter only the ones that are inside lines 3807 to 4887
for (let i = 3806; i < 4887; i++) {
  const lineNum = i + 1;
  const line = lines[i];
  if (!line) continue;

  let match;
  // Simple scan of XML-like tags on the line
  const matches = line.match(/<[a-zA-Z0-9\._:-]+|<motion\.[a-zA-Z0-9\._:-]+|<\/[a-zA-Z0-9\._:-]+|<\/motion\.[a-zA-Z500-9\._:-]+/g) || [];
  
  for (const m of matches) {
    if (m.startsWith('</')) {
      const tagName = m.substring(2);
      if (stack.length === 0) {
        console.log(`L${lineNum}: Closing tag ${m} without opening tag!`);
      } else {
        const top = stack.pop();
        if (top.tag !== tagName) {
          console.log(`L${lineNum}: Mismatched closing tag. Got ${m}, expected close for ${top.m} from L${top.line}`);
          // Put it back to keep tracking if needed
          stack.push(top);
        }
      }
    } else {
      // Opening tag
      const tagName = m.substring(1).split(/\s/)[0];
      // Skip self-closing check in this primitive line-by-line, but let's be careful about known ones
      // In JSX, input, img, br, hr could be self-closing, but here let's skip
      if (['img', 'input', 'hr', 'br', 'Search', 'Sparkles', 'Calendar', 'Trash2', 'Edit2', 'ChevronRight', 'Bookmark', 'BookmarkX', 'BrainCircuit', 'ClipboardList', 'Palette', 'Loader2', 'CheckCircle2', 'Info', 'TableProperties', 'List', 'MoreHorizontal'].some(x => tagName.startsWith(x))) {
        continue;
      }
      stack.push({ tag: tagName, m, line: lineNum });
    }
  }
}

console.log('Final stack size:', stack.length);
if (stack.length > 0) {
  console.log('Unclosed tags remaining:');
  stack.forEach(item => {
    console.log(`  - ${item.m} from L${item.line}`);
  });
}
