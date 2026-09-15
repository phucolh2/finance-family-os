const fs = require('fs');
const content = fs.readFileSync('src/pages/KnowledgeCenter.tsx', 'utf-8');
const lines = content.split('\n');

const top = lines.slice(0, 182);
const bottom = lines.slice(524);
const newLines = [
  '          <Card className="bg-white shadow-sm border-family-accent/15">',
  '            <CardContent className="p-6 md:p-10">',
  '              <SimpleMarkdown content={RELATIONSHIP_GUIDE_MD} />',
  '            </CardContent>',
  '          </Card>'
];

const final = [...top, ...newLines, ...bottom];
fs.writeFileSync('src/pages/KnowledgeCenter.tsx', final.join('\n'));
