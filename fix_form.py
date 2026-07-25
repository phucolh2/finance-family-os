with open('src/components/portfolio/SinkingFundModule.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace(
    "{filterFundType === 'debt_prep' ? 'Quản lý Tất toán & Rút gốc' : 'Giải ngân thành Thương vụ mới'}",
    "{filterFundType === 'debt_prep' ? 'Quản lý Tất toán & Rút gốc' : (filterFundType === 'investment' ? 'Giải ngân thành Thương vụ mới' : 'Sử dụng / Rút quỹ')}"
)

code = code.replace(
    """                      {filterFundType !== 'debt_prep' && (
                        <Input
                          label="Tên thương vụ đầu tư"
                          value={disburseForm.dealName}
                          onChange={(e) => { setDisburseForm({ ...disburseForm, dealName: e.target.value }); }}
                          placeholder={`VD: Mua ${fund.name}`}
                        />
                      )}""",
    """                      {filterFundType !== 'debt_prep' && (
                        <Input
                          label={filterFundType === 'investment' ? "Tên thương vụ đầu tư" : "Mục đích sử dụng quỹ"}
                          value={disburseForm.dealName}
                          onChange={(e) => { setDisburseForm({ ...disburseForm, dealName: e.target.value }); }}
                          placeholder={filterFundType === 'investment' ? `VD: Mua ${fund.name}` : `VD: Chi tiêu cho ${fund.name}`}
                        />
                      )}"""
)

with open('src/components/portfolio/SinkingFundModule.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
