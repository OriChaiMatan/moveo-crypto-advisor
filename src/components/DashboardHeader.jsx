import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { userService } from '../services/user.service'
import { useOutsideClick } from '../hooks/useOutsideClick'

// The header owns only its own two dropdowns. The sections it links to are
// decided by the page, so the same order drives the shortcuts and the content.
export function DashboardHeader({ userName = '', sections = [] }) {

    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isNavOpen, setIsNavOpen] = useState(false)
    const accountRef = useRef(null)
    const navRef = useRef(null)

    const navigate = useNavigate()

    useOutsideClick(navRef, isNavOpen, () => setIsNavOpen(false))
    useOutsideClick(accountRef, isMenuOpen, () => setIsMenuOpen(false))

    async function onLogout() {
        setIsMenuOpen(false)
        await userService.logout()
        navigate('/login')
    }

    return (
        <header className="dashboard-header">
            <div className="dashboard-header-inner">
                <div className="brand">
                    <span className="brand-mark" aria-hidden="true">
                        <svg viewBox="0 0 24 24">
                            <polyline points="3,16 9,10 13,13 21,5" />
                        </svg>
                    </span>
                    <span className="brand-name">Crypto Advisor</span>
                </div>

                <nav className="header-nav" aria-label="Dashboard sections">
                    {sections.map(section => (
                        <a href={`#${section.id}`} key={section.id}>{section.label}</a>
                    ))}
                </nav>

                <div className="header-actions">
                <div className="header-nav-mobile" ref={navRef}>
                    <button
                        type="button"
                        className="nav-toggle"
                        onClick={() => setIsNavOpen(prevIsOpen => !prevIsOpen)}
                        aria-haspopup="menu"
                        aria-expanded={isNavOpen}
                        aria-label="Dashboard sections"
                    >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M4 7h16" />
                            <path d="M4 12h16" />
                            <path d="M4 17h16" />
                        </svg>
                    </button>

                    {isNavOpen && (
                        <div className="nav-menu" role="menu">
                            {sections.map(section => (
                                <a
                                    href={`#${section.id}`}
                                    key={section.id}
                                    role="menuitem"
                                    onClick={() => setIsNavOpen(false)}
                                >
                                    {section.label}
                                </a>
                            ))}
                        </div>
                    )}
                </div>

                <div className="header-account" ref={accountRef}>
                    <button
                        type="button"
                        className="account-trigger"
                        onClick={() => setIsMenuOpen(prevIsOpen => !prevIsOpen)}
                        aria-haspopup="menu"
                        aria-expanded={isMenuOpen}
                    >
                        <span className="account-avatar" aria-hidden="true">
                            {userName.charAt(0).toUpperCase()}
                        </span>
                        <span className="account-name">{userName}</span>
                        <svg className="account-chevron" viewBox="0 0 24 24" aria-hidden="true">
                            <polyline points="6,9 12,15 18,9" />
                        </svg>
                    </button>

                    {isMenuOpen && (
                        <div className="account-menu" role="menu">
                            <button type="button" className="menu-item" role="menuitem">Profile</button>
                            <button type="button" className="menu-item" role="menuitem">Settings</button>
                            <div className="menu-separator" role="separator"></div>
                            <button
                                type="button"
                                className="menu-item menu-item-logout"
                                role="menuitem"
                                onClick={onLogout}
                            >
                                Log out
                            </button>
                        </div>
                    )}
                </div>
                </div>
            </div>
        </header>
    )
}
