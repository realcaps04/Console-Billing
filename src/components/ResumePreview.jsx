import { forwardRef } from 'react'
import { getResumeDeclaration } from '../lib/resumes'

function Section({ title, children }) {
  if (!children) return null
  return (
    <section className="resume-section">
      <h3 className="resume-section-title">{title}</h3>
      <div className="resume-section-body">{children}</div>
    </section>
  )
}

function clean(list) {
  return (Array.isArray(list) ? list : []).map((s) => String(s || '').trim()).filter(Boolean)
}

const ResumePreview = forwardRef(function ResumePreview({ state }, ref) {
  const skills = clean(state.skills)
  const certifications = clean(state.certifications)
  const languages = clean(state.languages)
  const experience = (state.experience || []).filter((e) => e.company || e.role || e.details)
  const education = (state.education || []).filter((e) => e.school || e.degree)
  const projects = (state.projects || []).filter((p) => p.name || p.details)
  const declaration = getResumeDeclaration(state.category)
  const signName = String(state.fullName || '').trim()

  const contactParts = [
    state.email,
    state.phone,
    state.location,
    state.linkedin,
    state.portfolio,
  ].filter(Boolean)

  return (
    <section className="resume-preview-panel">
      <div className="resume-preview-body">
        <div className="resume-sheet" ref={ref}>
          <div className="resume-sheet-main">
            <header className="resume-header">
              <h1 className="resume-name">{state.fullName || 'Your Name'}</h1>
              {state.headline && (
                <p className="resume-headline">{state.headline}</p>
              )}
              {contactParts.length > 0 && (
                <p className="resume-contact">{contactParts.join('  ·  ')}</p>
              )}
            </header>

            <Section title="Professional Summary">
              {state.summary ? <p className="resume-paragraph">{state.summary}</p> : null}
            </Section>

            <Section title="Skills">
              {skills.length > 0 ? (
                <p className="resume-skills">{skills.join('  ·  ')}</p>
              ) : null}
            </Section>

            <Section title="Experience">
              {experience.length > 0 ? (
                <div className="resume-entries">
                  {experience.map((item) => (
                    <article key={item.id} className="resume-entry">
                      <div className="resume-entry-top">
                        <div>
                          <h4 className="resume-entry-title">{item.role || 'Role'}</h4>
                          <p className="resume-entry-org">{item.company || 'Company'}</p>
                        </div>
                        <p className="resume-entry-dates">
                          {[item.startDate, item.current ? 'Present' : item.endDate].filter(Boolean).join(' – ')}
                        </p>
                      </div>
                      {item.details && (
                        <ul className="resume-bullets">
                          {item.details.split('\n').map((line) => line.trim()).filter(Boolean).map((line, i) => (
                            <li key={i}>{line}</li>
                          ))}
                        </ul>
                      )}
                    </article>
                  ))}
                </div>
              ) : null}
            </Section>

            <Section title="Projects">
              {projects.length > 0 ? (
                <div className="resume-entries">
                  {projects.map((item) => (
                    <article key={item.id} className="resume-entry">
                      <div className="resume-entry-top">
                        <h4 className="resume-entry-title">{item.name || 'Project'}</h4>
                        {item.link && <p className="resume-entry-dates">{item.link}</p>}
                      </div>
                      {item.details && <p className="resume-paragraph">{item.details}</p>}
                    </article>
                  ))}
                </div>
              ) : null}
            </Section>

            <Section title="Education">
              {education.length > 0 ? (
                <div className="resume-entries">
                  {education.map((item) => (
                    <article key={item.id} className="resume-entry">
                      <div className="resume-entry-top">
                        <div>
                          <h4 className="resume-entry-title">{item.degree || 'Degree'}</h4>
                          <p className="resume-entry-org">{item.school || 'Institution'}</p>
                        </div>
                        {item.year && <p className="resume-entry-dates">{item.year}</p>}
                      </div>
                      {item.details && <p className="resume-paragraph">{item.details}</p>}
                    </article>
                  ))}
                </div>
              ) : null}
            </Section>

            <Section title="Certifications">
              {certifications.length > 0 ? (
                <ul className="resume-simple-list">
                  {certifications.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              ) : null}
            </Section>

            <Section title="Languages">
              {languages.length > 0 ? (
                <p className="resume-skills">{languages.join('  ·  ')}</p>
              ) : null}
            </Section>
          </div>

          <footer className="resume-footer">
            <h3 className="resume-section-title">Declaration</h3>
            <p className="resume-declaration">{declaration}</p>
            <div className="resume-sign-row">
              <span>Place: {state.location || '————————'}</span>
              {signName ? <span className="resume-sign-name">{signName}</span> : null}
            </div>
          </footer>
        </div>
      </div>
    </section>
  )
})

export default ResumePreview
