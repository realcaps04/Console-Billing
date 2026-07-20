import { useState } from 'react'
import { formatIndianPhone } from '../utils'
import PasswordInput from './PasswordInput'
import {
  ACCOUNT_TYPE_OPTIONS,
  BLOOD_GROUP_OPTIONS,
  CUSTOMER_FORM_FIELDS,
  CUSTOMER_SECTION_NAV,
  EMPLOYMENT_TYPE_OPTIONS,
  GENDER_OPTIONS,
  MARITAL_OPTIONS,
  YES_NO_OPTIONS,
} from '../lib/loanCustomerSections'
import { LOAN_STATUSES } from '../lib/loanDocuments'

function IconClipboard() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  )
}

async function copyTextToClipboard(text) {
  const value = String(text ?? '').trim()
  if (!value) return false
  try {
    await navigator.clipboard.writeText(value)
    return true
  } catch {
    try {
      const area = document.createElement('textarea')
      area.value = value
      area.setAttribute('readonly', '')
      area.style.position = 'fixed'
      area.style.left = '-9999px'
      document.body.appendChild(area)
      area.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(area)
      return ok
    } catch {
      return false
    }
  }
}

function FieldWithCopy({ value, copyValue, readOnly, multiline = false, children }) {
  const [copied, setCopied] = useState(false)
  const textToCopy = String(copyValue ?? value ?? '').trim()
  const canCopy = readOnly && textToCopy

  if (!readOnly) return children

  const handleCopy = async () => {
    const ok = await copyTextToClipboard(textToCopy)
    if (!ok) return
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className={`docs-field-copy-wrap${multiline ? ' multiline' : ''}`}>
      <div className="docs-field-copy-input">{children}</div>
      {canCopy ? (
        <button
          type="button"
          className={`docs-field-copy-btn${copied ? ' copied' : ''}`}
          onClick={() => { void handleCopy() }}
          title={copied ? 'Copied' : 'Copy to clipboard'}
          aria-label={copied ? 'Copied' : 'Copy to clipboard'}
        >
          {copied ? '✓' : <IconClipboard />}
        </button>
      ) : null}
    </div>
  )
}

function getStatusLabel(status) {
  return LOAN_STATUSES.find((item) => item.value === status)?.label || status || ''
}

function Field({ label, children, full, error, required }) {
  return (
    <div className={`resume-field${full ? ' full' : ''}${error ? ' has-error' : ''}`}>
      <label>
        {label}
        {required ? <span className="resume-req" aria-hidden="true"> *</span> : null}
      </label>
      {children}
      {error ? <span className="field-error">{error}</span> : null}
    </div>
  )
}

function OverviewTableRow({ label, required, error, children }) {
  return (
    <tr className={`docs-form-table-row${error ? ' has-error' : ''}`}>
      <th scope="row">
        {label}
        {required ? <span className="resume-req" aria-hidden="true"> *</span> : null}
      </th>
      <td>
        {children}
        {error ? <span className="field-error">{error}</span> : null}
      </td>
    </tr>
  )
}

function formatFieldValue(value, field) {
  const raw = String(value ?? '')
  if (field.type === 'tel') return formatIndianPhone(raw)
  if (field.inputMode === 'pin') return raw.replace(/\D/g, '').slice(0, 6)
  if (field.inputMode === 'aadhaar') return raw.replace(/\D/g, '').slice(0, 12)
  if (field.inputMode === 'pan') return raw.toUpperCase().slice(0, 10)
  if (field.inputMode === 'ifsc') return raw.toUpperCase().slice(0, 11)
  if (field.inputMode === 'numeric') return raw.replace(/\D/g, '')
  return raw
}

function renderSelect(value, onChange, options, disabled) {
  return (
    <select value={value} onChange={onChange} disabled={disabled}>
      {options.map((opt) => (
        <option key={opt.value ?? opt} value={opt.value ?? opt}>
          {opt.label ?? opt}
        </option>
      ))}
    </select>
  )
}

function SchemaField({ field, value, onChange, error, disabled }) {
  const common = {
    value: value ?? '',
    disabled,
    onChange: (e) => onChange(formatFieldValue(e.target.value, field)),
  }

  if (field.type === 'textarea') {
    return <textarea rows={3} {...common} />
  }
  if (field.type === 'gender') {
    return renderSelect(value, (e) => onChange(e.target.value), ['Select', ...GENDER_OPTIONS.filter(Boolean)].map((v) => ({ value: v === 'Select' ? '' : v, label: v })), disabled)
  }
  if (field.type === 'marital') {
    return renderSelect(value, (e) => onChange(e.target.value), MARITAL_OPTIONS.map((v) => ({ value: v, label: v || 'Select' })), disabled)
  }
  if (field.type === 'bloodGroup') {
    return renderSelect(value, (e) => onChange(e.target.value), BLOOD_GROUP_OPTIONS.map((v) => ({ value: v, label: v || 'Select' })), disabled)
  }
  if (field.type === 'employmentType') {
    return renderSelect(value, (e) => onChange(e.target.value), EMPLOYMENT_TYPE_OPTIONS.map((v) => ({ value: v, label: v || 'Select' })), disabled)
  }
  if (field.type === 'accountType') {
    return renderSelect(value, (e) => onChange(e.target.value), ACCOUNT_TYPE_OPTIONS.map((v) => ({ value: v, label: v || 'Select' })), disabled)
  }
  if (field.type === 'yesNo') {
    return renderSelect(value, (e) => onChange(e.target.value), YES_NO_OPTIONS, disabled)
  }
  if (field.type === 'kycStatus') {
    return renderSelect(value, (e) => onChange(e.target.value), [
      { value: '', label: 'Select' },
      { value: 'pending', label: 'Pending' },
      { value: 'submitted', label: 'Submitted' },
      { value: 'verified', label: 'Verified' },
      { value: 'rejected', label: 'Rejected' },
    ], disabled)
  }
  if (field.type === 'password') {
    return <PasswordInput {...common} autoComplete="new-password" />
  }

  return (
    <input
      type={field.type === 'email' ? 'email' : field.type === 'date' ? 'date' : field.type === 'url' ? 'url' : field.type === 'tel' ? 'tel' : 'text'}
      {...common}
      inputMode={field.inputMode === 'numeric' || field.inputMode === 'pin' || field.inputMode === 'aadhaar' ? 'numeric' : undefined}
      autoComplete={field.type === 'email' ? 'email' : field.type === 'tel' ? 'tel' : 'off'}
    />
  )
}

function SectionForm({ stateKey, state, updateSection, showErrors, fieldErrors, disabledFields = [], readOnly = false }) {
  const fields = CUSTOMER_FORM_FIELDS[stateKey] || []
  return (
    <div className="docs-section-grid">
      {fields.map((field) => {
        const sectionErrors = fieldErrors?.[stateKey] || {}
        const fieldError = sectionErrors[field.key] || (field.key === 'email' ? sectionErrors.email : '')
        const isDisabled = readOnly || disabledFields.includes(field.key)
        return (
          <Field
            key={field.key}
            label={field.label}
            full={field.full}
            error={showErrors ? fieldError : ''}
          >
            <FieldWithCopy
              value={state[stateKey]?.[field.key]}
              readOnly={readOnly}
              multiline={field.type === 'textarea'}
            >
              <SchemaField
                field={field}
                value={state[stateKey]?.[field.key]}
                disabled={isDisabled}
                onChange={(value) => updateSection(stateKey, field.key, value)}
              />
            </FieldWithCopy>
          </Field>
        )
      })}
    </div>
  )
}

export { CUSTOMER_SECTION_NAV }

export default function LoanCustomerForm({
  section,
  state,
  selectedLoanType,
  updateTop,
  updateSection,
  showErrors,
  validationErrors,
  readOnly = false,
}) {
  if (section === 'overview') {
    return (
      <div className="docs-form-table-wrap">
        <table className="docs-form-table">
          <thead>
            <tr>
              <th scope="col">Field</th>
              <th scope="col">Details</th>
            </tr>
          </thead>
          <tbody>
            <OverviewTableRow label="Customer name" required error={showErrors ? validationErrors.customerName : ''}>
              <FieldWithCopy value={state.customerName} readOnly={readOnly}>
                <input
                  type="text"
                  value={state.customerName}
                  onChange={(e) => updateTop('customerName', e.target.value)}
                  placeholder="Primary name for this customer"
                  disabled={readOnly}
                />
              </FieldWithCopy>
            </OverviewTableRow>
            <OverviewTableRow label="Loan type">
              <FieldWithCopy value={selectedLoanType?.name} readOnly={readOnly}>
                <input type="text" value={selectedLoanType?.name || '—'} disabled />
              </FieldWithCopy>
            </OverviewTableRow>
            <OverviewTableRow label="Loan / application reference">
              <FieldWithCopy value={state.loanReference} readOnly={readOnly}>
                <input
                  type="text"
                  value={state.loanReference}
                  onChange={(e) => updateTop('loanReference', e.target.value)}
                  placeholder="Application ID, file number, etc."
                  disabled={readOnly}
                />
              </FieldWithCopy>
            </OverviewTableRow>
            <OverviewTableRow label="Status">
              <FieldWithCopy value={state.status} copyValue={getStatusLabel(state.status)} readOnly={readOnly}>
                <select value={state.status} onChange={(e) => updateTop('status', e.target.value)} disabled={readOnly}>
                  {LOAN_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </FieldWithCopy>
            </OverviewTableRow>
            <OverviewTableRow label="Notes">
              <FieldWithCopy value={state.notes} readOnly={readOnly} multiline>
                <textarea
                  rows={4}
                  value={state.notes}
                  onChange={(e) => updateTop('notes', e.target.value)}
                  placeholder="Internal notes about this application"
                  disabled={readOnly}
                />
              </FieldWithCopy>
            </OverviewTableRow>
          </tbody>
        </table>
      </div>
    )
  }

  const nav = CUSTOMER_SECTION_NAV.find((item) => item.id === section)
  if (!nav?.stateKey) return null

  const disabledFields = nav.stateKey === 'addressDetails' && state.addressDetails?.currentSameAsPermanent === 'yes'
    ? ['currentAddress']
    : []

  return (
    <SectionForm
      stateKey={nav.stateKey}
      state={state}
      updateSection={updateSection}
      showErrors={showErrors}
      fieldErrors={validationErrors}
      disabledFields={disabledFields}
      readOnly={readOnly}
    />
  )
}
