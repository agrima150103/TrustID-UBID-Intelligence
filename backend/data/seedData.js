const CryptoJS = require("crypto-js");

const SALT = "TRUSTID_KARNATAKA_SANDBOX_SALT";

function blindHash(value) {
  if (!value) return null;
  return CryptoJS.SHA256(`${SALT}:${String(value).trim().toUpperCase()}`).toString();
}

const records = [
  {
    source_system: "Shop Establishment",
    source_record_id: "SE-560058-1001",
    business_name: "Sri Lakshmi Precision Tools Pvt Ltd",
    address: "Plot 14, 3rd Cross, Peenya Industrial Area Phase 1, Bengaluru",
    pin_code: "560058",
    district: "Bengaluru Urban",
    sector: "Manufacturing",
    pan: "AABCL1234F",
    gstin: "29AABCL1234F1Z8",
    proprietor: "Ramesh Kumar",
    phone: "9876543210"
  },
  {
    source_system: "Factories",
    source_record_id: "FAC-PEE-8832",
    business_name: "S L Precision Tools Private Limited",
    address: "No 14, 3 Cross, Peenya Industrial Estate, Phase I, Bangalore",
    pin_code: "560058",
    district: "Bengaluru Urban",
    sector: "Manufacturing",
    pan: "AABCL1234F",
    gstin: "29AABCL1234F1Z8",
    proprietor: "Ramesh Kumar",
    phone: "9876543210"
  },
  {
    source_system: "KSPCB",
    source_record_id: "KSPCB-2020-991",
    business_name: "Lakshmi Precision Tools",
    address: "Plot No.14, Peenya Industrial Area, Bengaluru",
    pin_code: "560058",
    district: "Bengaluru Urban",
    sector: "Manufacturing",
    pan: "",
    gstin: "29AABCL1234F1Z8",
    proprietor: "R Kumar",
    phone: "9876543210"
  },
  {
    source_system: "Labour",
    source_record_id: "LAB-44821",
    business_name: "Sri Lakshmi Precision Tooling",
    address: "14, Peenya Industrial Area Phase 1, Bangalore",
    pin_code: "560058",
    district: "Bengaluru Urban",
    sector: "Manufacturing",
    pan: "",
    gstin: "",
    proprietor: "Ramesh K",
    phone: "9876543210"
  },

  {
    source_system: "Shop Establishment",
    source_record_id: "SE-560022-1102",
    business_name: "Raju Steels Pvt Ltd",
    address: "88, Tumkur Road, Yeshwanthpur Industrial Suburb, Bengaluru",
    pin_code: "560022",
    district: "Bengaluru Urban",
    sector: "Steel Trading",
    pan: "AAECR8842P",
    gstin: "29AAECR8842P1Z2",
    proprietor: "Raju Menon",
    phone: "9845011111"
  },
  {
    source_system: "Factories",
    source_record_id: "FAC-YES-2033",
    business_name: "Raju Steel Private Limited",
    address: "No 88, Tumkur Rd, Yeshwanthpur Industrial Area, Bangalore",
    pin_code: "560022",
    district: "Bengaluru Urban",
    sector: "Steel Trading",
    pan: "AAECR8842P",
    gstin: "",
    proprietor: "Raju Menon",
    phone: "9845011111"
  },
  {
    source_system: "BESCOM",
    source_record_id: "BES-998812",
    business_name: "M/s Raju Steels",
    address: "88 Tumkur Road Yeshwanthpur Bengaluru",
    pin_code: "560022",
    district: "Bengaluru Urban",
    sector: "Electricity Consumer - HT",
    pan: "",
    gstin: "",
    proprietor: "R Menon",
    phone: "9845011111"
  },

  {
    source_system: "Shop Establishment",
    source_record_id: "SE-560058-1300",
    business_name: "GreenChem Coatings LLP",
    address: "Shed 21, Peenya 2nd Stage, Bengaluru",
    pin_code: "560058",
    district: "Bengaluru Urban",
    sector: "Chemical",
    pan: "AAGFG7777L",
    gstin: "29AAGFG7777L1Z5",
    proprietor: "Farhan Ali",
    phone: "9900012300"
  },
  {
    source_system: "KSPCB",
    source_record_id: "KSPCB-GC-551",
    business_name: "Green Chem Coating",
    address: "Shed No 21, Peenya Second Stage, Bangalore",
    pin_code: "560058",
    district: "Bengaluru Urban",
    sector: "Chemical",
    pan: "",
    gstin: "",
    proprietor: "F Ali",
    phone: "9900012300"
  },

  {
    source_system: "Food Safety",
    source_record_id: "FSSAI-560022-77",
    business_name: "Annapurna Foods",
    address: "12 Market Road, Yeshwanthpur, Bengaluru",
    pin_code: "560022",
    district: "Bengaluru Urban",
    sector: "Food Processing",
    pan: "AAHFA1235M",
    gstin: "29AAHFA1235M1Z9",
    proprietor: "Meena Rao",
    phone: "9988776655"
  },
  {
    source_system: "BWSSB",
    source_record_id: "BWSSB-21901",
    business_name: "Annapoorna Food Products",
    address: "No 12, Market Rd, Yeshwanthpur, Bangalore",
    pin_code: "560022",
    district: "Bengaluru Urban",
    sector: "Water Consumer",
    pan: "",
    gstin: "",
    proprietor: "M Rao",
    phone: "9988776655"
  },

  {
    source_system: "Shop Establishment",
    source_record_id: "SE-560058-2001",
    business_name: "BluePeak Traders",
    address: "Plot 14, 3rd Cross, Peenya Industrial Area Phase 1, Bengaluru",
    pin_code: "560058",
    district: "Bengaluru Urban",
    sector: "Trading",
    pan: "AABPB9999K",
    gstin: "29AABPB9999K1Z1",
    proprietor: "Ramesh Kumar",
    phone: "9876543210"
  },
  {
    source_system: "Labour",
    source_record_id: "LAB-560058-2099",
    business_name: "Blue Peak Industrial Suppliers",
    address: "Plot 14, 3 Cross, Peenya Industrial Estate, Bengaluru",
    pin_code: "560058",
    district: "Bengaluru Urban",
    sector: "Trading",
    pan: "",
    gstin: "",
    proprietor: "R Kumar",
    phone: "9876543210"
  },

  {
    source_system: "Factories",
    source_record_id: "FAC-560058-4040",
    business_name: "Metro Alloy Works",
    address: "99, 8th Main, Peenya Industrial Area, Bengaluru",
    pin_code: "560058",
    district: "Bengaluru Urban",
    sector: "Manufacturing",
    pan: "AAFCM4040D",
    gstin: "29AAFCM4040D1ZE",
    proprietor: "Devika Nair",
    phone: "9000004040"
  },
  {
    source_system: "BESCOM",
    source_record_id: "BES-4040",
    business_name: "Metro Aloy Works",
    address: "99 8 Main Peenya Industrial Area Bangalore",
    pin_code: "560058",
    district: "Bengaluru Urban",
    sector: "Electricity Consumer - LT",
    pan: "",
    gstin: "",
    proprietor: "D Nair",
    phone: "9000004040"
  }
];

const events = [
  {
    source_system: "Factories",
    source_record_id: "FAC-PEE-8832",
    event_type: "Inspection",
    event_date: "2024-06-12",
    signal_strength: 5,
    description: "Factory safety inspection completed"
  },
  {
    source_system: "KSPCB",
    source_record_id: "KSPCB-2020-991",
    event_type: "Consent Renewal",
    event_date: "2025-03-10",
    signal_strength: 5,
    description: "Pollution consent renewed"
  },
  {
    source_system: "BESCOM",
    source_record_id: "BES-998812",
    event_type: "Electricity Consumption",
    event_date: "2026-04-02",
    signal_strength: 4,
    description: "High-tension monthly power consumption detected"
  },
  {
    source_system: "Factories",
    source_record_id: "FAC-YES-2033",
    event_type: "Inspection",
    event_date: "2023-08-01",
    signal_strength: 3,
    description: "Last recorded factory inspection"
  },
  {
    source_system: "KSPCB",
    source_record_id: "KSPCB-GC-551",
    event_type: "Compliance Filing",
    event_date: "2022-11-20",
    signal_strength: 2,
    description: "Last compliance filing"
  },
  {
    source_system: "Food Safety",
    source_record_id: "FSSAI-560022-77",
    event_type: "License Renewal",
    event_date: "2026-02-11",
    signal_strength: 5,
    description: "Food safety license renewed"
  },
  {
    source_system: "BWSSB",
    source_record_id: "BWSSB-21901",
    event_type: "Water Usage",
    event_date: "2026-04-12",
    signal_strength: 4,
    description: "Commercial water usage recorded"
  },
  {
    source_system: "Labour",
    source_record_id: "LAB-560058-2099",
    event_type: "Labour Filing",
    event_date: "2026-01-14",
    signal_strength: 4,
    description: "Labour compliance filing submitted"
  },
  {
    source_system: "BESCOM",
    source_record_id: "BES-4040",
    event_type: "Electricity Consumption",
    event_date: "2023-01-20",
    signal_strength: 1,
    description: "Low power usage before possible closure"
  }
];

const preparedRecords = records.map((record) => ({
  ...record,
  pan_hash: blindHash(record.pan),
  gstin_hash: blindHash(record.gstin),
  proprietor_hash: blindHash(record.proprietor),
  phone_hash: blindHash(record.phone),
  raw_pan_present: record.pan ? 1 : 0,
  raw_gstin_present: record.gstin ? 1 : 0
}));

module.exports = {
  records: preparedRecords,
  events,
  blindHash
};
