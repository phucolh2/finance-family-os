import os

with open('src/types/finance.ts', 'r', encoding='utf-8') as f:
    types_code = f.read()

types_code = types_code.replace(
    "rolloverStrategy?: 'principal_and_interest' | 'principal_only' | 'none';",
    "rolloverStrategy?: 'principal_and_interest' | 'principal_only' | 'none' | 'return_to_source';"
)

with open('src/types/finance.ts', 'w', encoding='utf-8') as f:
    f.write(types_code)


with open('src/engines/sinkingFundEngine.ts', 'r', encoding='utf-8') as f:
    engine = f.read()

engine = engine.replace(
    "import { SinkingFund } from '../types/finance';",
    "import type { SinkingFund } from '../types/finance';"
)
engine = engine.replace(
    "import { safeNumber } from '../utils/formatters';\n",
    ""
)

# Fix the residual buckets replacement
engine = engine.replace(
    """periodKey,
              contribAmount: 0,
              depositBank: mb.depositBank,
              rolloverStrategy: mb.rolloverStrategy
           });
        }
     } else {
        amountToDeduct -= buckets[i].principal;""",
    """periodKey,
              contribAmount: 0,
              depositBank: buckets[i].depositBank,
              rolloverStrategy: buckets[i].rolloverStrategy
           });
        }
     } else {
        amountToDeduct -= buckets[i].principal;"""
)


with open('src/engines/sinkingFundEngine.ts', 'w', encoding='utf-8') as f:
    f.write(engine)

print("Done")
