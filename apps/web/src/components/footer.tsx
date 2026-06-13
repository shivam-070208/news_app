"use client"

import { useState } from "react"

export function Footer() {
  const [email, setEmail] = useState("")

  return (
    <footer className="w-full border-t border-slate-100 bg-white font-inter text-sm dark:border-slate-900 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-6 py-12 sm:px-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-5">
          {/* Logo & Description */}
          <div className="flex flex-col gap-4 md:col-span-1">
            <span className="text-lg leading-tight font-bold text-slate-900 dark:text-white">
              THE MODERN
              <br />
              BROADSHEET
            </span>
            <p className="max-w-xs text-xs text-slate-600 dark:text-neutral-400">
              Defining the narrative of the 21st century through uncompromising
              integrity and high-end editorial storytelling.
            </p>

            {/* Subscribe to Dispatch */}
            <div className="mt-4">
              <label className="mb-1 block text-xs font-semibold text-slate-900 dark:text-white">
                SUBSCRIBE TO DISPATCH
              </label>
              <form
                className="flex"
                onSubmit={(e) => {
                  e.preventDefault()
                  // Handle subscription here if needed
                }}
              >
                <input
                  type="email"
                  className="rounded-l border border-slate-200 bg-transparent px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:text-white"
                  placeholder="Your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  aria-label="Your email address"
                />
                <button
                  type="submit"
                  className="rounded-r bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-700"
                >
                  JOIN
                </button>
              </form>
            </div>
          </div>

          {/* Trending Categories */}
          <div>
            <div className="mb-2 text-xs font-semibold tracking-wide text-slate-700 dark:text-white">
              TRENDING CATEGORIES
            </div>
            <ul className="space-y-2 text-slate-600 dark:text-neutral-400">
              <li>Quantum Computing</li>
              <li>Geopolitics</li>
              <li>Digital Ethics</li>
              <li>Green Finance</li>
              <li>Future of Work</li>
            </ul>
          </div>

          {/* Featured Links */}
          <div>
            <div className="mb-2 text-xs font-semibold tracking-wide text-slate-700 dark:text-white">
              FEATURED LINKS
            </div>
            <ul className="space-y-2 text-slate-600 dark:text-neutral-400">
              <li>Prime Minister of India</li>
              <li>World Economic Forum</li>
              <li>United Nations Portal</li>
              <li>Archive Center</li>
              <li>Global Works</li>
            </ul>
          </div>

          {/* Information */}
          <div>
            <div className="mb-2 text-xs font-semibold tracking-wide text-slate-700 dark:text-white">
              INFORMATION
            </div>
            <ul className="space-y-2 text-slate-600 dark:text-neutral-400">
              <li>About Us</li>
              <li>Privacy Policy</li>
              <li>Terms of Service</li>
              <li>Newsletter</li>
              <li>Contact</li>
            </ul>
          </div>
        </div>
        {/* Copyright and Developer credit row */}
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-6 md:flex-row dark:border-slate-900">
          <span className="text-xs text-slate-400 dark:text-neutral-500">
            © 2024 The Modern Broadsheet. All Rights Reserved.
          </span>
          <span className="text-xs text-slate-400 dark:text-neutral-500">
            DEVELOPED WITH <span className="text-red-500">♥</span> BY{" "}
            <span className="font-bold text-slate-500 dark:text-white">
              BYTESTORIES
            </span>
          </span>
        </div>
      </div>
    </footer>
  )
}
