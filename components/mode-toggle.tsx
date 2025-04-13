"use client"

import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"
import "../styles/globals.css"
import "../styles/button.css"
import "../styles/dropdown.css"
import { useState } from "react"

export function ModeToggle() {
  const { setTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className={`dropdown ${isOpen ? "open" : ""}`}>
      <button className="dropdown-trigger button button-outline button-icon" onClick={() => setIsOpen(!isOpen)}>
        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </button>
      <div className="dropdown-content">
        <button
          className="dropdown-item"
          onClick={() => {
            setTheme("light")
            setIsOpen(false)
          }}
        >
          Light
        </button>
        <button
          className="dropdown-item"
          onClick={() => {
            setTheme("dark")
            setIsOpen(false)
          }}
        >
          Dark
        </button>
        <button
          className="dropdown-item"
          onClick={() => {
            setTheme("system")
            setIsOpen(false)
          }}
        >
          System
        </button>
      </div>
    </div>
  )
}
