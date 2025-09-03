'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Share, X } from 'react-feather'
import ShareModal from './ShareModal'

interface Product {
  id: string
  title: string
  price: string
  image: string
  brand: string
}

interface Category {
  id: string
  name: string
  icon: string
  selected: boolean
}

export default function StorePage() {
  const [activeTab, setActiveTab] = useState('items')
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [categories, setCategories] = useState<Category[]>([
    { id: 'apparel', name: 'Apparel', icon: 'https://0d8ab5fd581da03d1946ff12c0bf7e45.cdn.bubble.io/cdn-cgi/image/w=24,h=24,f=auto,dpr=0.5,fit=contain/f1741336298040x973075572068639900/Appareal.png', selected: false },
    { id: 'beauty', name: 'Beauty', icon: 'https://0d8ab5fd581da03d1946ff12c0bf7e45.cdn.bubble.io/cdn-cgi/image/w=24,h=24,f=auto,dpr=0.5,fit=contain/f1744630503818x180576774572709820/Beauty.png', selected: false },
    { id: 'beverages', name: 'Beverages', icon: 'https://0d8ab5fd581da03d1946ff12c0bf7e45.cdn.bubble.io/cdn-cgi/image/w=24,h=24,f=auto,dpr=0.5,fit=contain/f1744812501467x927496749795387600/Beverage.png', selected: false },
    { id: 'equipment', name: 'Equipment', icon: 'https://0d8ab5fd581da03d1946ff12c0bf7e45.cdn.bubble.io/cdn-cgi/image/w=24,h=24,f=auto,dpr=0.5,fit=contain/f1744812560390x809009568565174500/Device%20%26%20Equipment.png', selected: false },
    { id: 'food', name: 'Food', icon: 'https://0d8ab5fd581da03d1946ff12c0bf7e45.cdn.bubble.io/cdn-cgi/image/w=24,h=24,f=auto,dpr=0.5,fit=contain/f1747754338545x265449861946970720/Food.png', selected: false },
    { id: 'health', name: 'Health Testing & Diagnostics', icon: 'https://0d8ab5fd581da03d1946ff12c0bf7e45.cdn.bubble.io/cdn-cgi/image/w=24,h=24,f=auto,dpr=0.5,fit=contain/f1756170593579x179653594705773140/Scientific%20Testing%20Icon%20Design.png', selected: false },
    { id: 'home', name: 'Home & Living', icon: 'https://0d8ab5fd581da03d1946ff12c0bf7e45.cdn.bubble.io/cdn-cgi/image/w=24,h=24,f=auto,dpr=0.5,fit=contain/f1749456551636x923580001093749600/home%26living.png', selected: false },
    { id: 'supplements', name: 'Supplements', icon: 'https://0d8ab5fd581da03d1946ff12c0bf7e45.cdn.bubble.io/cdn-cgi/image/w=24,h=24,f=auto,dpr=0.5,fit=contain/f1741195950427x583672317048608400/Supplement.png', selected: false },
    { id: 'wellness', name: 'Wellness Devices & Wearables', icon: 'https://0d8ab5fd581da03d1946ff12c0bf7e45.cdn.bubble.io/cdn-cgi/image/w=24,h=24,f=auto,dpr=0.5,fit=contain/f1744812616883x350090269077145500/Electronics.png', selected: false }
  ])

  const products: Product[] = [
    {
      id: '1',
      title: 'Moto Closed Toe Grip Sock',
      price: '$19.00',
      image: 'https://0d8ab5fd581da03d1946ff12c0bf7e45.cdn.bubble.io/cdn-cgi/image/w=384,h=384,f=auto,dpr=0.5,fit=cover,q=75/f1742481551251x731730048914074400/Aqua.jpg',
      brand: 'Arebesk'
    },
    {
      id: '2',
      title: 'Phish Net Closed Toe Grip...',
      price: '$18.00',
      image: 'https://0d8ab5fd581da03d1946ff12c0bf7e45.cdn.bubble.io/cdn-cgi/image/w=384,h=384,f=auto,dpr=0.5,fit=cover,q=75/f1742481719785x235441395907995300/https___0d8ab5fd581da03d1946ff12c0bf7e45.cdn.bubble.io_f1741372922221x303211958007745700_Black-Black.jpg',
      brand: 'Arebesk'
    },
    {
      id: '3',
      title: "Classic Women's Crew Grip...",
      price: '$19.00',
      image: 'https://0d8ab5fd581da03d1946ff12c0bf7e45.cdn.bubble.io/cdn-cgi/image/w=384,h=384,f=auto,dpr=0.5,fit=cover,q=75/f1741374559144x667992581822430300/Black.jpg',
      brand: 'Arebesk'
    }
  ]

  const handleCategoryToggle = (categoryId: string) => {
    setCategories(categories.map(cat => 
      cat.id === categoryId 
        ? { ...cat, selected: !cat.selected }
        : cat
    ))
  }

  const clearAllFilters = () => {
    setCategories(categories.map(cat => ({ ...cat, selected: false })))
  }

  const handleShare = () => {
    setIsShareModalOpen(true)
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-5 py-6 space-y-6">
      {/* Brand Header */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-6">
              <div className="flex flex-col gap-1">
                <h1 className="text-lg font-inter-tight font-semibold text-gray-800">
                  Arebesk
                </h1>
              </div>
            </div>
          </div>
          
          <button
            onClick={handleShare}
            className="flex items-center gap-2.5 px-5 py-3 border border-gray-700 rounded-lg font-inter font-semibold text-gray-700 hover:bg-gray-50 transition-all duration-200"
          >
            <Share size={20} />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex gap-0">
          <button
            onClick={() => setActiveTab('items')}
            className={`px-9 py-4 font-inter-tight font-semibold transition-colors ${
              activeTab === 'items'
                ? 'text-orange-500 border-b-2 border-orange-500'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Items
          </button>
          <button
            onClick={() => setActiveTab('affiliate')}
            className={`px-9 py-4 font-inter-tight font-medium transition-colors ${
              activeTab === 'affiliate'
                ? 'text-orange-500 border-b-2 border-orange-500'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Affiliate Shops
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`px-9 py-4 font-inter-tight font-medium transition-colors ${
              activeTab === 'about'
                ? 'text-orange-500 border-b-2 border-orange-500'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            About
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex gap-6">
        {/* Sidebar Filters */}
        <div className="w-80 flex-shrink-0 sticky top-24">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="space-y-4">
              <button
                onClick={clearAllFilters}
                className="text-orange-500 font-raleway font-medium hover:text-orange-600 transition-colors"
              >
                Reset Filters
              </button>
              
              <div className="space-y-3">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    onClick={() => handleCategoryToggle(category.id)}
                    className="flex items-center gap-2.5 p-2.5 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="w-5 h-5 flex-shrink-0">
                      <Image
                        src={category.icon}
                        alt={category.name}
                        width={20}
                        height={20}
                        className="object-contain"
                      />
                    </div>
                    <span className="flex-1 text-sm font-poppins font-bold text-gray-700">
                      {category.name}
                    </span>
                    <div className="w-4 h-4 flex-shrink-0">
                      {category.selected ? (
                        <div className="w-full h-full bg-orange-500 rounded-sm" />
                      ) : (
                        <div className="w-full h-full border border-gray-300 rounded-sm" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1">
          {activeTab === 'items' && (
            <div className="space-y-6">
              {/* Apparel Section */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <h2 className="text-xl font-inter font-semibold text-gray-800">
                      Apparel
                    </h2>
                    <div className="w-12 h-0.5 bg-orange-500" />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product) => (
                      <div
                        key={product.id}
                        className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                      >
                        <div className="relative aspect-square">
                          <Image
                            src={product.image}
                            alt={product.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                        </div>
                        
                        <div className="p-5 space-y-3">
                          <div className="space-y-1">
                            <h3 className="text-lg font-inter font-semibold text-gray-800 line-clamp-1">
                              {product.title}
                            </h3>
                            <div className="w-4 h-0.5 bg-orange-500" />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600 text-sm font-inter">
                              <span className="text-gray-800">by</span> {product.brand}
                            </span>
                          </div>
                          
                          <div className="text-xl font-inter font-semibold text-gray-800">
                            {product.price}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="space-y-6">
                <h2 className="text-lg font-inter-tight font-semibold text-gray-800">
                  Store Description
                </h2>
                
                <div className="prose prose-sm text-gray-700 font-inter leading-relaxed">
                  <p>
                    Arebesk is a home grown, mom owned luxury brand known for creating the first designer grip sock. 
                    Arebesk launched out of a garage with just enough funding to bring in one style, the Phish Net collection, 
                    and no budget left for marketing. After selling out in two local Los Angeles studios, studios around the world 
                    started demanding Arebesk, noticing our unique designs and unbeatable quality.
                  </p>
                  
                  <p>
                    Arebesk founder and pilates enthusiast Leana Shayefar received the inspiration for the company after falling 
                    in love with the pilates workout and struggling to find a grip sock that offered both style and traction.
                  </p>
                  
                  <p>
                    Arebesk is the first grip sock to offer two half circle silicone patches on the ball and heel of the foot, 
                    as well as a silicone tab inside the heel of the sock. This patented design uses double the silicone of 
                    traditional grip socks, providing extra cushion, a more secure fit, and remarkable traction throughout long 
                    periods of use. Arebesk also pioneered our signature mesh drawstring wash bag, which protects the silicone 
                    grip in the wash cycle and is sold with every pair of Arebesk grip socks.
                  </p>
                  
                  <p>
                    As a company rooted in movement, our name Arebesk pays homage to the "arabesque," a standard ballet step 
                    where the body is supported on one leg while the other leg sweeps backwards. As a step utilized in Pilates 
                    and other movement based workouts, it serves as a reminder of the diverse community of fitness enthusiasts 
                    we aim to serve with our products.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        url="https://cleeri.com/store/arebesk"
        title="Arebesk Store - Premium Grip Socks"
      />
    </div>
  )
}
