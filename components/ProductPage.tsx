'use client'

import { useState } from 'react'
import Image from 'next/image'
import { MapPin, Share } from 'react-feather'

interface ProductImage {
  src: string
  alt: string
}

export default function ProductPage() {
  const [selectedSize, setSelectedSize] = useState('XSmall')
  const [selectedColor, setSelectedColor] = useState('Black')
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  const productImages: ProductImage[] = [
    {
      src: 'https://0d8ab5fd581da03d1946ff12c0bf7e45.cdn.bubble.io/cdn-cgi/image/w=512,h=512,f=auto,dpr=0.75,fit=contain/f1742481551251x731730048914074400/Aqua.jpg',
      alt: 'Moto Closed Toe Grip Sock - Aqua'
    },
    {
      src: 'https://0d8ab5fd581da03d1946ff12c0bf7e45.cdn.bubble.io/cdn-cgi/image/w=64,h=64,f=auto,dpr=1.25,fit=contain,q=25/f1742481566335x766991926326567000/motoclosedtoeblackfront.jpg',
      alt: 'Moto Closed Toe Grip Sock - Black'
    },
    {
      src: 'https://0d8ab5fd581da03d1946ff12c0bf7e45.cdn.bubble.io/cdn-cgi/image/w=64,h=64,f=auto,dpr=1.25,fit=contain,q=25/f1742481571470x597967383373267900/motoburg.jpg',
      alt: 'Moto Closed Toe Grip Sock - Burgundy'
    }
  ]

  const sizes = ['XSmall', 'Small', 'Medium', 'Large']
  const colors = ['Black', 'Aqua', 'Burgundy']

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Moto Closed Toe Grip Sock',
        text: 'Check out this amazing grip sock from Arebesk!',
        url: window.location.href,
      })
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto bg-gray-100 p-5 relative">
      {/* Breadcrumb Navigation */}
      <div className="flex justify-center mb-8">
        <div className="flex-1 max-w-none min-w-[232px]">
          <nav className="text-gray-700 font-inter font-medium text-sm">
            <a 
              href="https://cleeri.com/" 
              className="text-gray-700 hover:text-orange-500 transition-colors"
            >
              Home
            </a>
            <span className="mx-2">|</span>
            <a 
              href="https://cleeri.com/store/1741366231949x356923031760928800"
              className="text-gray-700 hover:text-orange-500 transition-colors"
            >
              Arebesk
            </a>
            <span className="mx-2">| Moto Closed Toe Grip Sock</span>
          </nav>
        </div>
      </div>

      {/* Main Product Container */}
      <div className="bg-white rounded-lg flex flex-wrap justify-center gap-5 lg:gap-8 p-8">
        {/* Product Images Section */}
        <div className="flex-1 min-w-0 max-w-[475px] sticky top-[100px]">
          <div className="flex flex-col gap-2.5">
            {/* Main Product Image */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="relative w-full aspect-square">
                <Image
                  src={productImages[selectedImageIndex].src}
                  alt={productImages[selectedImageIndex].alt}
                  fill
                  className="object-cover rounded-lg"
                  sizes="(max-width: 475px) 100vw, 475px"
                />
              </div>
            </div>

            {/* Thumbnail Images */}
            <div className="flex gap-3 overflow-x-auto">
              {productImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                    selectedImageIndex === index 
                      ? 'border-orange-500' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="relative w-full h-full">
                    <Image
                      src={image.src}
                      alt={image.alt}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  </div>
                </button>
              ))}
            </div>

            {/* Brand Info Section */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-200">
                <Image
                  src="https://d1muf25xaso8hp.cloudfront.net/https%3A%2F%2F0d8ab5fd581da03d1946ff12c0bf7e45.cdn.bubble.io%2Ff1741366318609x325363241914905300%2FArebesk.avif?w=64&h=64&auto=compress&dpr=1.25&fit=max"
                  alt="Arebesk Logo"
                  width={48}
                  height={48}
                  className="object-contain"
                />
              </div>
              <div className="flex-1">
                <h3 className="font-inter font-semibold text-gray-800">Arebesk</h3>
                <p className="text-sm text-gray-600 font-inter">rachel@arebesk.com</p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-700 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">
                <MapPin size={20} />
                Contact Us
              </button>
            </div>
          </div>
        </div>

        {/* Product Details Section */}
        <div className="flex-1 min-w-0 flex flex-col gap-5">
          {/* Brand and Share */}
          <div className="flex justify-between items-center">
            <a 
              href="https://cleeri.com/store/arebesk-1?brand="
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-800 font-work-sans hover:text-orange-500 transition-colors"
            >
              by Arebesk
            </a>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-5 py-3 border border-gray-700 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Share size={20} />
              Share
            </button>
          </div>

          {/* Product Title */}
          <div className="border-b border-gray-200 pb-1">
            <h1 className="text-4xl font-inter font-semibold text-gray-800 leading-tight">
              Moto Closed Toe Grip Sock
            </h1>
          </div>

          {/* Price */}
          <div className="text-4xl font-inter font-semibold text-gray-800">
            $19.00
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="text-gray-700 font-inter leading-6">
              <strong className="font-bold">Description</strong>
              <br />
              Moto Grip Sock (patented)
              <br />
              Grip sock featuring pleated interior panel design.
              <br />
              Patented grip designed to provide excellent traction.
              <br />
              Extra silicone on the high contact areas: the ball and heel of the foot.
            </div>
            <button className="text-sm text-gray-700 underline hover:text-orange-500 transition-colors">
              See more
            </button>
          </div>

          {/* Product Options */}
          <div className="space-y-8">
            {/* Size Selector */}
            <div className="space-y-2">
              <h3 className="font-inter font-semibold text-gray-800">Size</h3>
              <div className="flex gap-3 overflow-x-auto">
                {sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-6 py-2 min-h-[40px] border rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                      selectedSize === size
                        ? 'bg-orange-100 border-orange-500 text-orange-700'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Selector */}
            <div className="space-y-2">
              <h3 className="font-inter font-semibold text-gray-800">Color</h3>
              <div className="flex gap-3 overflow-x-auto">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`px-6 py-2 min-h-[40px] border rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                      selectedColor === color
                        ? 'bg-orange-100 border-orange-500 text-orange-700'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Add to Cart Button (Currently Hidden in Original) */}
          <div className="hidden">
            <button className="w-full bg-orange-500 text-white font-inter font-semibold text-sm py-3 px-5 rounded-lg shadow-lg hover:bg-orange-600 transition-colors min-w-[120px]">
              Add to cart
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
