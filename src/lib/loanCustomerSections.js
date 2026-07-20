/** Customer profile section schemas for loan document records. */

function emptyKeys(keys) {
  return keys.reduce((acc, key) => {
    acc[key] = ''
    return acc
  }, {})
}

export const CUSTOMER_SECTION_NAV = [
  { id: 'overview', label: 'Overview', stateKey: null, keywords: 'summary reference status notes' },
  { id: 'personal', label: 'Personal details', stateKey: 'personalDetails', keywords: 'name dob age gender marital nationality religion caste occupation education blood' },
  { id: 'family', label: 'Parent / family', stateKey: 'familyDetails', keywords: 'father mother spouse guardian dependents' },
  { id: 'contact', label: 'Contact', stateKey: 'contactDetails', keywords: 'mobile phone whatsapp email emergency' },
  { id: 'address', label: 'Address', stateKey: 'addressDetails', keywords: 'permanent current office pin district village street' },
  { id: 'kyc', label: 'Identity & KYC', stateKey: 'kycDetails', keywords: 'aadhaar pan passport voter ration ckyc gstin udyam photo' },
  { id: 'employment', label: 'Employment', stateKey: 'employmentDetails', keywords: 'employer salary designation joining experience retired' },
  { id: 'business', label: 'Business', stateKey: 'businessDetails', keywords: 'self employed gst turnover constitution registration' },
  { id: 'income', label: 'Income & finance', stateKey: 'incomeDetails', keywords: 'income expenses assets liabilities itr tax rental agricultural' },
  { id: 'existingLoan', label: 'Existing loan', stateKey: 'existingLoanDetails', keywords: 'emi outstanding sanction lending institution tenure' },
  { id: 'bank', label: 'Bank details', stateKey: 'bankDetails', keywords: 'account ifsc branch upi holder balance' },
  { id: 'nominee', label: 'Nominee', stateKey: 'nomineeDetails', keywords: 'nominee relationship beneficiary' },
  { id: 'guarantor', label: 'Guarantor / co-applicant', stateKey: 'guarantorDetails', keywords: 'guarantor co applicant cosigner' },
  { id: 'assets', label: 'Assets', stateKey: 'assetDetails', keywords: 'house land vehicle gold machinery fd investment insurance' },
  { id: 'collateral', label: 'Collateral', stateKey: 'collateralDetails', keywords: 'security mortgage valuation collateral owner' },
  { id: 'references', label: 'References', stateKey: 'referenceDetails', keywords: 'reference contact verifier' },
  { id: 'documents', label: 'Documents', stateKey: 'documentsDetails', keywords: 'aadhaar pan slip statement itr proof certificate rc' },
  { id: 'login', label: 'Login credentials', stateKey: 'loginCredentials', keywords: 'username password portal security login' },
]

export const SELECTABLE_CUSTOMER_SECTIONS = CUSTOMER_SECTION_NAV.filter((item) => item.id !== 'overview')

const VALID_SECTION_IDS = new Set(CUSTOMER_SECTION_NAV.map((item) => item.id))

export function normalizeEnabledSectionIds(ids) {
  if (!Array.isArray(ids)) return []
  return [...new Set(ids.filter((id) => VALID_SECTION_IDS.has(id) && id !== 'overview'))]
}

function sectionHasData(sectionData) {
  if (!sectionData || typeof sectionData !== 'object') return false
  return Object.values(sectionData).some((value) => String(value ?? '').trim())
}

export function inferEnabledSectionsFromData(record) {
  const enabled = []
  for (const item of SELECTABLE_CUSTOMER_SECTIONS) {
    if (sectionHasData(record?.[item.stateKey])) enabled.push(item.id)
  }
  return enabled
}

export function resolveEnabledSectionIds(record) {
  const profile = record?.customerProfile && typeof record.customerProfile === 'object'
    ? record.customerProfile
    : {}
  const fromProfile = normalizeEnabledSectionIds(profile.enabledSectionIds)
  if (fromProfile.length) return fromProfile
  const fromRecord = normalizeEnabledSectionIds(record?.enabledSectionIds)
  if (fromRecord.length) return fromRecord
  return inferEnabledSectionsFromData(record)
}

export function getVisibleCustomerSections(enabledSectionIds) {
  const enabled = new Set(normalizeEnabledSectionIds(enabledSectionIds))
  return CUSTOMER_SECTION_NAV.filter((item) => item.id === 'overview' || enabled.has(item.id))
}

export function filterSectionsByQuery(query) {
  const q = String(query || '').trim().toLowerCase()
  if (!q) return SELECTABLE_CUSTOMER_SECTIONS
  return SELECTABLE_CUSTOMER_SECTIONS.filter((item) => {
    const haystack = `${item.label} ${item.keywords || ''} ${item.id}`.toLowerCase()
    return haystack.includes(q)
  })
}

export const YES_NO_OPTIONS = [
  { value: '', label: 'Select' },
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
]

export const GENDER_OPTIONS = ['', 'Male', 'Female', 'Other']
export const MARITAL_OPTIONS = ['', 'Single', 'Married', 'Divorced', 'Widowed']
export const BLOOD_GROUP_OPTIONS = ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
export const EMPLOYMENT_TYPE_OPTIONS = ['', 'Salaried', 'Self-employed', 'Business', 'Retired', 'Student', 'Homemaker', 'Other']
export const ACCOUNT_TYPE_OPTIONS = ['', 'Savings', 'Current', 'Salary', 'NRE', 'NRO']

const SECTION_FIELD_KEYS = {
  personalDetails: [
    'fullName', 'dateOfBirth', 'age', 'gender', 'maritalStatus', 'nationality', 'religion',
    'casteCategory', 'occupation', 'educationalQualification', 'bloodGroup',
  ],
  familyDetails: [
    'fatherName', 'fatherOccupation', 'fatherMobile', 'motherName', 'motherOccupation', 'motherMobile',
    'spouseName', 'spouseOccupation', 'spouseIncome', 'numberOfDependents',
    'guardianName', 'guardianRelationship', 'guardianContactNumber',
  ],
  contactDetails: [
    'primaryMobile', 'alternateMobile', 'whatsappNumber', 'email',
    'emergencyContactName', 'emergencyContactNumber', 'emergencyContactRelationship',
  ],
  addressDetails: [
    'permanentAddress', 'houseNameNumber', 'street', 'village', 'postOffice', 'city', 'district',
    'state', 'country', 'pinCode', 'currentSameAsPermanent', 'currentAddress',
    'companyName', 'officeAddress',
  ],
  kycDetails: [
    'aadhaar', 'pan', 'passportNumber', 'drivingLicence', 'voterId', 'rationCard', 'ckycNumber',
    'gstin', 'udyamRegistration', 'passportPhotoNotes', 'kycStatus', 'kycNotes',
  ],
  employmentDetails: [
    'employmentType', 'employerName', 'department', 'designation', 'employeeId', 'dateOfJoining',
    'yearsOfExperience', 'retirementDate', 'monthlySalary', 'salaryMode',
  ],
  businessDetails: [
    'businessName', 'businessType', 'constitution', 'gstNumber', 'registrationNumber',
    'natureOfBusiness', 'businessAddress', 'yearsInBusiness', 'annualTurnover',
  ],
  incomeDetails: [
    'monthlyIncome', 'annualIncome', 'otherIncome', 'rentalIncome', 'agriculturalIncome',
    'monthlyExpenses', 'assetsValue', 'liabilities', 'incomeTaxFiled', 'last3YearsItr',
  ],
  existingLoanDetails: [
    'hasExistingLoan', 'loanType', 'lendingInstitution', 'sanctionAmount', 'outstandingBalance',
    'emi', 'remainingTenure',
  ],
  bankDetails: [
    'bankName', 'branch', 'ifsc', 'accountNumber', 'accountType', 'accountHolderName',
    'averageMonthlyBalance', 'upiId',
  ],
  nomineeDetails: [
    'nomineeName', 'nomineeRelationship', 'nomineeDateOfBirth', 'nomineeAadhaar',
    'nomineeMobile', 'nomineeAddress',
  ],
  guarantorDetails: [
    'guarantorFullName', 'guarantorRelationship', 'guarantorMobile', 'guarantorAadhaar',
    'guarantorPan', 'guarantorOccupation', 'guarantorMonthlyIncome', 'guarantorAddress',
  ],
  assetDetails: [
    'house', 'land', 'vehicle', 'gold', 'machinery', 'fixedDeposit', 'investments', 'insurancePolicies',
  ],
  collateralDetails: [
    'collateralType', 'description', 'ownerName', 'estimatedMarketValue', 'purchaseValue',
    'insuranceDetails', 'documentNumber',
  ],
  referenceDetails: [
    'ref1Name', 'ref1Relationship', 'ref1Mobile', 'ref1Address',
    'ref2Name', 'ref2Relationship', 'ref2Mobile', 'ref2Address',
  ],
  documentsDetails: [
    'docAadhaar', 'docPan', 'docPassportPhoto', 'docAddressProof', 'docIncomeProof', 'docSalarySlip',
    'docBankStatement', 'docItr', 'docProperty', 'docVehicleRc', 'docGoldValuation',
    'docGstCertificate', 'docBusinessRegistration', 'docOther',
  ],
  loginCredentials: [
    'portalUrl', 'username', 'password', 'confirmPassword', 'securityQuestion', 'securityAnswer', 'loginNotes',
  ],
}

export function createEmptyCustomerSections() {
  return Object.fromEntries(
    Object.entries(SECTION_FIELD_KEYS).map(([key, fields]) => [key, emptyKeys(fields)]),
  )
}

export const CUSTOMER_FORM_FIELDS = {
  personalDetails: [
    { key: 'fullName', label: 'Full name' },
    { key: 'dateOfBirth', label: 'Date of birth', type: 'date' },
    { key: 'age', label: 'Age', inputMode: 'numeric' },
    { key: 'gender', label: 'Gender', type: 'gender' },
    { key: 'maritalStatus', label: 'Marital status', type: 'marital' },
    { key: 'nationality', label: 'Nationality' },
    { key: 'religion', label: 'Religion' },
    { key: 'casteCategory', label: 'Caste / category' },
    { key: 'occupation', label: 'Occupation' },
    { key: 'educationalQualification', label: 'Educational qualification', full: true },
    { key: 'bloodGroup', label: 'Blood group', type: 'bloodGroup' },
  ],
  familyDetails: [
    { key: 'fatherName', label: "Father's name" },
    { key: 'fatherOccupation', label: "Father's occupation" },
    { key: 'fatherMobile', label: "Father's mobile", type: 'tel' },
    { key: 'motherName', label: "Mother's name" },
    { key: 'motherOccupation', label: "Mother's occupation" },
    { key: 'motherMobile', label: "Mother's mobile", type: 'tel' },
    { key: 'spouseName', label: 'Spouse name' },
    { key: 'spouseOccupation', label: 'Spouse occupation' },
    { key: 'spouseIncome', label: 'Spouse income' },
    { key: 'numberOfDependents', label: 'Number of dependents', inputMode: 'numeric' },
    { key: 'guardianName', label: 'Guardian name (if applicable)' },
    { key: 'guardianRelationship', label: 'Guardian relationship' },
    { key: 'guardianContactNumber', label: 'Guardian contact number', type: 'tel' },
  ],
  contactDetails: [
    { key: 'primaryMobile', label: 'Primary mobile', type: 'tel' },
    { key: 'alternateMobile', label: 'Alternate mobile', type: 'tel' },
    { key: 'whatsappNumber', label: 'WhatsApp number', type: 'tel' },
    { key: 'email', label: 'Email address', type: 'email' },
    { key: 'emergencyContactName', label: 'Emergency contact name' },
    { key: 'emergencyContactNumber', label: 'Emergency contact number', type: 'tel' },
    { key: 'emergencyContactRelationship', label: 'Relationship with emergency contact' },
  ],
  addressDetails: [
    { key: 'permanentAddress', label: 'Permanent address', type: 'textarea', full: true },
    { key: 'houseNameNumber', label: 'House name / number' },
    { key: 'street', label: 'Street' },
    { key: 'village', label: 'Village' },
    { key: 'postOffice', label: 'Post office' },
    { key: 'city', label: 'City' },
    { key: 'district', label: 'District' },
    { key: 'state', label: 'State' },
    { key: 'country', label: 'Country' },
    { key: 'pinCode', label: 'PIN code', inputMode: 'pin' },
    { key: 'currentSameAsPermanent', label: 'Current address same as permanent', type: 'yesNo' },
    { key: 'currentAddress', label: 'Current address', type: 'textarea', full: true },
    { key: 'companyName', label: 'Company name' },
    { key: 'officeAddress', label: 'Office address', type: 'textarea', full: true },
  ],
  kycDetails: [
    { key: 'aadhaar', label: 'Aadhaar number', inputMode: 'aadhaar' },
    { key: 'pan', label: 'PAN number', inputMode: 'pan' },
    { key: 'passportNumber', label: 'Passport number' },
    { key: 'drivingLicence', label: 'Driving licence' },
    { key: 'voterId', label: 'Voter ID' },
    { key: 'rationCard', label: 'Ration card' },
    { key: 'ckycNumber', label: 'CKYC number' },
    { key: 'gstin', label: 'GSTIN (business)' },
    { key: 'udyamRegistration', label: 'UDYAM registration' },
    { key: 'passportPhotoNotes', label: 'Passport size photograph', full: true },
    { key: 'kycStatus', label: 'KYC status', type: 'kycStatus' },
    { key: 'kycNotes', label: 'KYC notes', type: 'textarea', full: true },
  ],
  employmentDetails: [
    { key: 'employmentType', label: 'Employment type', type: 'employmentType' },
    { key: 'employerName', label: 'Employer name' },
    { key: 'department', label: 'Department' },
    { key: 'designation', label: 'Designation' },
    { key: 'employeeId', label: 'Employee ID' },
    { key: 'dateOfJoining', label: 'Date of joining', type: 'date' },
    { key: 'yearsOfExperience', label: 'Years of experience' },
    { key: 'retirementDate', label: 'Retirement date', type: 'date' },
    { key: 'monthlySalary', label: 'Monthly salary' },
    { key: 'salaryMode', label: 'Salary mode' },
  ],
  businessDetails: [
    { key: 'businessName', label: 'Business name' },
    { key: 'businessType', label: 'Business type' },
    { key: 'constitution', label: 'Constitution' },
    { key: 'gstNumber', label: 'GST number' },
    { key: 'registrationNumber', label: 'Registration number' },
    { key: 'natureOfBusiness', label: 'Nature of business', full: true },
    { key: 'businessAddress', label: 'Business address', type: 'textarea', full: true },
    { key: 'yearsInBusiness', label: 'Years in business' },
    { key: 'annualTurnover', label: 'Annual turnover' },
  ],
  incomeDetails: [
    { key: 'monthlyIncome', label: 'Monthly income' },
    { key: 'annualIncome', label: 'Annual income' },
    { key: 'otherIncome', label: 'Other income' },
    { key: 'rentalIncome', label: 'Rental income' },
    { key: 'agriculturalIncome', label: 'Agricultural income' },
    { key: 'monthlyExpenses', label: 'Monthly expenses' },
    { key: 'assetsValue', label: 'Assets value' },
    { key: 'liabilities', label: 'Liabilities' },
    { key: 'incomeTaxFiled', label: 'Income tax filed', type: 'yesNo' },
    { key: 'last3YearsItr', label: 'Last 3 years ITR', full: true },
  ],
  existingLoanDetails: [
    { key: 'hasExistingLoan', label: 'Existing loan', type: 'yesNo' },
    { key: 'loanType', label: 'Loan type' },
    { key: 'lendingInstitution', label: 'Lending institution' },
    { key: 'sanctionAmount', label: 'Sanction amount' },
    { key: 'outstandingBalance', label: 'Outstanding balance' },
    { key: 'emi', label: 'EMI' },
    { key: 'remainingTenure', label: 'Remaining tenure' },
  ],
  bankDetails: [
    { key: 'bankName', label: 'Bank name' },
    { key: 'branch', label: 'Branch' },
    { key: 'ifsc', label: 'IFSC', inputMode: 'ifsc' },
    { key: 'accountNumber', label: 'Account number', inputMode: 'numeric' },
    { key: 'accountType', label: 'Account type', type: 'accountType' },
    { key: 'accountHolderName', label: 'Account holder name' },
    { key: 'averageMonthlyBalance', label: 'Average monthly balance' },
    { key: 'upiId', label: 'UPI ID' },
  ],
  nomineeDetails: [
    { key: 'nomineeName', label: 'Nominee name' },
    { key: 'nomineeRelationship', label: 'Relationship' },
    { key: 'nomineeDateOfBirth', label: 'Date of birth', type: 'date' },
    { key: 'nomineeAadhaar', label: 'Aadhaar number', inputMode: 'aadhaar' },
    { key: 'nomineeMobile', label: 'Mobile number', type: 'tel' },
    { key: 'nomineeAddress', label: 'Address', type: 'textarea', full: true },
  ],
  guarantorDetails: [
    { key: 'guarantorFullName', label: 'Full name' },
    { key: 'guarantorRelationship', label: 'Relationship' },
    { key: 'guarantorMobile', label: 'Mobile number', type: 'tel' },
    { key: 'guarantorAadhaar', label: 'Aadhaar', inputMode: 'aadhaar' },
    { key: 'guarantorPan', label: 'PAN', inputMode: 'pan' },
    { key: 'guarantorOccupation', label: 'Occupation' },
    { key: 'guarantorMonthlyIncome', label: 'Monthly income' },
    { key: 'guarantorAddress', label: 'Address', type: 'textarea', full: true },
  ],
  assetDetails: [
    { key: 'house', label: 'House' },
    { key: 'land', label: 'Land' },
    { key: 'vehicle', label: 'Vehicle' },
    { key: 'gold', label: 'Gold' },
    { key: 'machinery', label: 'Machinery' },
    { key: 'fixedDeposit', label: 'Fixed deposit' },
    { key: 'investments', label: 'Investments' },
    { key: 'insurancePolicies', label: 'Insurance policies', full: true },
  ],
  collateralDetails: [
    { key: 'collateralType', label: 'Collateral type' },
    { key: 'description', label: 'Description', type: 'textarea', full: true },
    { key: 'ownerName', label: 'Owner name' },
    { key: 'estimatedMarketValue', label: 'Estimated market value' },
    { key: 'purchaseValue', label: 'Purchase value' },
    { key: 'insuranceDetails', label: 'Insurance details', full: true },
    { key: 'documentNumber', label: 'Document number' },
  ],
  referenceDetails: [
    { key: 'ref1Name', label: 'Reference 1 — name' },
    { key: 'ref1Relationship', label: 'Reference 1 — relationship' },
    { key: 'ref1Mobile', label: 'Reference 1 — mobile', type: 'tel' },
    { key: 'ref1Address', label: 'Reference 1 — address', type: 'textarea', full: true },
    { key: 'ref2Name', label: 'Reference 2 — name' },
    { key: 'ref2Relationship', label: 'Reference 2 — relationship' },
    { key: 'ref2Mobile', label: 'Reference 2 — mobile', type: 'tel' },
    { key: 'ref2Address', label: 'Reference 2 — address', type: 'textarea', full: true },
  ],
  documentsDetails: [
    { key: 'docAadhaar', label: 'Aadhaar' },
    { key: 'docPan', label: 'PAN' },
    { key: 'docPassportPhoto', label: 'Passport photo' },
    { key: 'docAddressProof', label: 'Address proof' },
    { key: 'docIncomeProof', label: 'Income proof' },
    { key: 'docSalarySlip', label: 'Salary slip' },
    { key: 'docBankStatement', label: 'Bank statement' },
    { key: 'docItr', label: 'ITR' },
    { key: 'docProperty', label: 'Property documents' },
    { key: 'docVehicleRc', label: 'Vehicle RC' },
    { key: 'docGoldValuation', label: 'Gold valuation certificate' },
    { key: 'docGstCertificate', label: 'GST certificate' },
    { key: 'docBusinessRegistration', label: 'Business registration' },
    { key: 'docOther', label: 'Other documents', full: true },
  ],
  loginCredentials: [
    { key: 'portalUrl', label: 'Portal URL', full: true, type: 'url' },
    { key: 'username', label: 'Username' },
    { key: 'password', label: 'Password', type: 'password' },
    { key: 'confirmPassword', label: 'Confirm password', type: 'password' },
    { key: 'securityQuestion', label: 'Security question', full: true },
    { key: 'securityAnswer', label: 'Security answer' },
    { key: 'loginNotes', label: 'Login notes', type: 'textarea', full: true },
  ],
}

export function cleanCustomerSection(sectionKey, sectionData) {
  const keys = SECTION_FIELD_KEYS[sectionKey] || []
  const source = sectionData && typeof sectionData === 'object' ? sectionData : {}
  return keys.reduce((acc, key) => {
    acc[key] = String(source[key] ?? '').trim()
    return acc
  }, {})
}

export function mergeLegacyCustomerSections(record) {
  const sections = createEmptyCustomerSections()
  const profile = record?.customerProfile && typeof record.customerProfile === 'object'
    ? record.customerProfile
    : {}

  Object.keys(sections).forEach((key) => {
    sections[key] = { ...sections[key], ...(profile[key] || {}) }
  })

  const legacyPersonal = record?.personalDetails || {}
  const legacyKyc = record?.kycDetails || {}
  const legacyBank = record?.bankDetails || {}
  const legacyLogin = record?.loginCredentials || {}

  sections.personalDetails = {
    ...sections.personalDetails,
    ...legacyPersonal,
    fullName: sections.personalDetails.fullName || legacyPersonal.fullName || '',
  }
  sections.familyDetails = {
    ...sections.familyDetails,
    fatherName: sections.familyDetails.fatherName || legacyPersonal.fatherName || '',
    motherName: sections.familyDetails.motherName || legacyPersonal.motherName || '',
  }
  sections.contactDetails = {
    ...sections.contactDetails,
    primaryMobile: sections.contactDetails.primaryMobile || legacyPersonal.phone || '',
    alternateMobile: sections.contactDetails.alternateMobile || legacyPersonal.alternatePhone || '',
    email: sections.contactDetails.email || legacyPersonal.email || '',
  }
  sections.addressDetails = {
    ...sections.addressDetails,
    permanentAddress: sections.addressDetails.permanentAddress || legacyPersonal.address || '',
    city: sections.addressDetails.city || legacyPersonal.city || '',
    state: sections.addressDetails.state || legacyPersonal.state || '',
    pinCode: sections.addressDetails.pinCode || legacyPersonal.pincode || '',
  }
  sections.kycDetails = {
    ...sections.kycDetails,
    ...legacyKyc,
    passportNumber: sections.kycDetails.passportNumber || legacyKyc.passport || '',
    drivingLicence: sections.kycDetails.drivingLicence || legacyKyc.drivingLicense || '',
  }
  sections.bankDetails = { ...sections.bankDetails, ...legacyBank }
  sections.loginCredentials = { ...sections.loginCredentials, ...legacyLogin }

  return sections
}

export function buildCustomerProfile(state) {
  const sections = Object.fromEntries(
    Object.keys(SECTION_FIELD_KEYS).map((key) => [key, cleanCustomerSection(key, state?.[key])]),
  )
  return {
    ...sections,
    enabledSectionIds: normalizeEnabledSectionIds(state?.enabledSectionIds),
  }
}

export function applyCustomerSectionsToState(base, sections) {
  return {
    ...base,
    ...sections,
  }
}
