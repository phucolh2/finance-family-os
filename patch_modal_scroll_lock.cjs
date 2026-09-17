/**
 * Patches all family-tool pages to:
 * 1. Import useBodyScrollLock
 * 2. Call the hook with the modal-open state variable
 */
const fs = require('fs');
const path = require('path');

const pages = [
  { file: 'src/pages/GivingLedger.tsx',       stateVar: 'isModalOpen' },
  { file: 'src/pages/HealthTracker.tsx',       stateVar: 'isModalOpen' },
  { file: 'src/pages/HomeInventory.tsx',       stateVar: 'isModalOpen' },
  { file: 'src/pages/SubscriptionTracker.tsx', stateVar: 'isModalOpen' },
  { file: 'src/pages/FamilyContacts.tsx',      stateVar: 'isModalOpen' },
  { file: 'src/pages/DocumentVault.tsx',       stateVar: 'isModalOpen' },
  { file: 'src/pages/ChoreChart.tsx',          stateVar: 'isModalOpen' },
  { file: 'src/pages/ChildGrowth.tsx',         stateVar: 'isRecordModalOpen' },
];

const HOOK_IMPORT = "import { useBodyScrollLock } from '../hooks/useBodyScrollLock';";

pages.forEach(({ file, stateVar }) => {
  if (!fs.existsSync(file)) {
    console.log(`SKIP (not found): ${file}`);
    return;
  }
  let content = fs.readFileSync(file, 'utf8');

  // Skip if already patched
  if (content.includes('useBodyScrollLock')) {
    console.log(`SKIP (already patched): ${file}`);
    return;
  }

  // 1. Add import after the last import line
  const lastImportIdx = content.lastIndexOf("import ");
  const endOfLastImport = content.indexOf('\n', lastImportIdx) + 1;
  content = content.slice(0, endOfLastImport) + HOOK_IMPORT + '\n' + content.slice(endOfLastImport);

  // 2. Add hook call after the state variable declaration
  // Find: const [isModalOpen, setIsModalOpen] = useState(false);
  //   or: const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const statePattern = new RegExp(
    `(const \\[${stateVar}, set[A-Za-z]+\\] = useState[^;]+;)`
  );
  content = content.replace(statePattern, (match) => {
    return match + `\n  useBodyScrollLock(${stateVar});`;
  });

  fs.writeFileSync(file, content, 'utf8');
  console.log(`PATCHED: ${file}`);
});
