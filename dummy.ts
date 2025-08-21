const data = [
    ["metreshekhar249@gmail.com", "800", "2000", "{\"brand\":\"Apple\",\"modelName\":\"iPhone 13\",\"repairType\":{\"name\":\"Battery Replacement\",\"price\":\"800",
        "2000\"}}", "250816153728"
    ], ["metreshekhar249@gmail.com", "800", "2000", "{\"brand\":\"Apple\",\"modelName\":\"iPhone 13\",\"repairType\":{\"name\":\"Battery Replacement\",\"price\":\"800",
        "2000\"}}", "250816153642"
    ], ["metreshekhar249@gmail.com", "800", "2000", "{\"brand\":\"Apple\",\"modelName\":\"iPhone 13\",\"repairType\":{\"name\":\"Battery Replacement\",\"price\":\"800",
        "2000\"}}", "250816153108"
    ], ["metreshekhar249@gmail.com", "800", "2000", "[object Object]", "250816110802"], [
        "metreshekhar249@gmail.com", "800", "2000", "[object Object]", "250816110650"
    ], ["metreshekhar249@gmail.com", "800", "2000", "[object Object]", "250816110548"], [
        "metreshekhar249@gmail.com", "800", "2000", "[object Object]", "250816110537"
    ], ["metreshekhar249@gmail.com", "1", "1", "250815144313"], ["metreshekhar249@gmail.com",
        "1", "1", "250814222043"
    ], ["metreshekhar249@gmail.com", "10", "1", "250814215628"], ["metreshekhar249@gmail.com",
        "10", "1", "250814215353"
    ], ["txn_31467212"], ["txn_29694926"], ["txn_40093027"], ["txn_40027591"], ["txn_39761407"], ["txn_38614486"], ["txn_38538121"], ["txn_38495054"], ["txn_37915566"], ["txn_37840297"], ["txn_71675769"], ["txn_71109486"], ["txn_60306420"], ["txn_00286828"], ["txn_99629946"], ["txn_99160851"], ["txn_99145186"], ["txn_99110109"], ["txn_98812159"], ["txn_98670780"]
]


// Keep rows with length > 1 and pick the second-from-end (-2) element
export function pickSecondFromEndOfNonTrivialRows(data: unknown): any[] {
  if (!Array.isArray(data)) return [];
  return (data as unknown[])
    .filter((row): row is any[] => Array.isArray(row) && row.length > 1)
    .map((row)=>row[row.length - 3])
}


const secondFromEnd = pickSecondFromEndOfNonTrivialRows(data);
console.log(secondFromEnd);


