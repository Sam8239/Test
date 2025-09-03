'use client'

import { useState } from 'react'

export default function ContactForm() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    message: ''
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted:', formData)
    // Handle form submission here
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-5 relative">
      {/* Contact Info Section */}
      <div className="flex flex-wrap justify-between items-center gap-5 mb-8 max-w-3xl mx-auto">
        {/* Location */}
        <div className="flex items-center min-w-[179px]">
          <div className="bg-orange-500 rounded-full p-2 flex items-center justify-center w-9 h-9">
            <button className="text-white text-sm">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </button>
          </div>
          <span className="ml-2.5 text-gray-600 text-sm font-raleway">
            Carlsbad, CA
          </span>
        </div>

        {/* Email */}
        <div className="flex items-center min-w-[179px]">
          <div className="bg-orange-500 rounded-full p-2 flex items-center justify-center w-9 h-9">
            <button className="text-white text-sm">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
              </svg>
            </button>
          </div>
          <span className="ml-2.5 text-gray-600 text-sm font-raleway">
            Email: info@cleeri.com
          </span>
        </div>
      </div>

      {/* Contact Form Title */}
      <h2 className="text-center text-3xl font-black text-gray-800 mb-8 font-raleway">
        Contact Us
      </h2>

      {/* Contact Form */}
      <div className="max-w-xl mx-auto mb-12">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Full Name */}
          <div>
            <input
              type="text"
              name="fullName"
              placeholder="Full Name"
              value={formData.fullName}
              onChange={handleInputChange}
              className="w-full h-12 px-4 bg-gray-100 border border-gray-300 rounded-lg text-gray-800 font-poppins text-sm focus:outline-none focus:border-orange-500 transition-colors duration-200"
            />
          </div>

          {/* Email and Phone Row */}
          <div className="flex flex-wrap gap-2.5 justify-between">
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleInputChange}
              className="flex-1 min-w-[100px] h-12 px-4 bg-gray-100 border border-gray-300 rounded-lg text-gray-800 font-poppins text-sm focus:outline-none focus:border-orange-500 transition-colors duration-200"
            />
            <input
              type="tel"
              name="phone"
              placeholder="Phone number"
              value={formData.phone}
              onChange={handleInputChange}
              className="flex-1 min-w-[100px] h-12 px-4 bg-gray-100 border border-gray-300 rounded-lg text-gray-800 font-poppins text-sm focus:outline-none focus:border-orange-500 transition-colors duration-200"
            />
          </div>

          {/* Message */}
          <div>
            <textarea
              name="message"
              placeholder="Message"
              value={formData.message}
              onChange={handleInputChange}
              rows={8}
              className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-800 font-poppins text-sm font-medium resize-none focus:outline-none focus:border-orange-500 transition-colors duration-200"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-orange-500 text-white font-poppins text-sm font-semibold py-4 px-5 rounded-lg shadow-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all duration-200 cursor-pointer"
          >
            SEND MESSAGE
          </button>
        </form>
      </div>
    </div>
  )
}
