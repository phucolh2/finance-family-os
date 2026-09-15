const fs = require('fs');

function replaceInFile(filePath, replacements) {
    let content = fs.readFileSync(filePath, 'utf8');
    for (const {search, replace} of replacements) {
        if (typeof search === 'string') {
            content = content.split(search).join(replace);
        } else {
            content = content.replace(search, replace);
        }
    }
    fs.writeFileSync(filePath, content, 'utf8');
}

replaceInFile('src/components/portfolio/fund-cards/LifestyleFundCard.tsx', [
    { search: 'totalDisbursed, ', replace: '' }
]);
replaceInFile('src/components/portfolio/fund-cards/PortfolioFundCard.tsx', [
    { search: 'totalDisbursed, ', replace: '' }
]);
replaceInFile('src/components/portfolio/fund-cards/ReservesFundCard.tsx', [
    { search: 'totalDisbursed, ', replace: '' }
]);
replaceInFile('src/components/portfolio/SinkingFundModule_Portfolio.tsx', [
    { search: 'addInvestmentDeal, ', replace: '' },
    { search: 'addLifeEvent, ', replace: '' }
]);
replaceInFile('src/components/reserves/SinkingFundModule_Reserves.tsx', [
    { search: 'addInvestmentDeal, ', replace: '' },
    { search: 'addLifeEvent, ', replace: '' }
]);
replaceInFile('src/components/savings/SinkingFundModule_Savings.tsx', [
    { search: 'addInvestmentDeal, ', replace: '' },
    { search: 'addLifeEvent, ', replace: '' }
]);
replaceInFile('src/components/ui/Button.test.tsx', [
    { search: "import React from 'react';\n", replace: '' },
    { search: "import React from 'react';\r\n", replace: '' }
]);
replaceInFile('src/pages/LifeStages.test.tsx', [
    { search: "import React from 'react';\n", replace: '' },
    { search: "import React from 'react';\r\n", replace: '' }
]);
replaceInFile('src/pages/Portfolio.test.tsx', [
    { search: "import React from 'react';\n", replace: '' },
    { search: "import React from 'react';\r\n", replace: '' }
]);
