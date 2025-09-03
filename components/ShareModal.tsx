'use client'

import { useState } from 'react'
import { X, Copy, Facebook, Linkedin, MessageCircle } from 'react-feather'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  url: string
  title: string
}

export default function ShareModal({ isOpen, onClose, url, title }: ShareModalProps) {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy URL:', error)
    }
  }

  const handleShare = (platform: string) => {
    const encodedUrl = encodeURIComponent(url)
    const encodedTitle = encodeURIComponent(title)
    
    let shareUrl = ''
    
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
        break
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
        break
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`
        break
      default:
        return
    }
    
    window.open(shareUrl, '_blank', 'width=600,height=400')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-5">
      <div className="bg-white rounded-lg w-full max-w-lg mx-auto relative overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-poppins font-bold text-gray-800">
            Share Item
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* URL Section */}
          <div className="bg-gray-100 rounded-full px-4 py-3 flex items-center gap-3">
            <div className="flex-1 text-gray-700 font-raleway text-sm truncate">
              {url}
            </div>
            <button
              onClick={handleCopyUrl}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors flex-shrink-0"
              title="Copy URL"
            >
              <Copy size={18} className="text-gray-600" />
            </button>
          </div>
          
          {copied && (
            <div className="text-center text-sm text-green-600 font-medium">
              URL copied to clipboard!
            </div>
          )}

          {/* Social Media Buttons */}
          <div className="flex justify-center gap-8">
            {/* Facebook */}
            <div className="flex flex-col items-center space-y-2">
              <button
                onClick={() => handleShare('facebook')}
                className="w-12 h-12 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center transition-colors"
              >
                <Facebook size={24} className="text-white" />
              </button>
              <span className="text-sm font-raleway font-medium text-gray-700 tracking-wide">
                Facebook
              </span>
            </div>

            {/* LinkedIn */}
            <div className="flex flex-col items-center space-y-2">
              <button
                onClick={() => handleShare('linkedin')}
                className="w-12 h-12 bg-blue-700 hover:bg-blue-800 rounded-full flex items-center justify-center transition-colors"
              >
                <Linkedin size={24} className="text-white" />
              </button>
              <span className="text-sm font-raleway font-medium text-gray-700 tracking-wide">
                LinkedIn
              </span>
            </div>

            {/* WhatsApp */}
            <div className="flex flex-col items-center space-y-2">
              <button
                onClick={() => handleShare('whatsapp')}
                className="w-12 h-12 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center transition-colors"
              >
                <MessageCircle size={24} className="text-white" />
              </button>
              <span className="text-sm font-raleway font-medium text-gray-700 tracking-wide">
                WhatsApp
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
