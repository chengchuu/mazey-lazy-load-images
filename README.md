# mazey-lazy-load-images

[![NPM version][npm-image]][npm-url]
[![l][l-image]][l-url]

[npm-image]: https://img.shields.io/npm/v/mazey-lazy-load-images
[npm-url]: https://npmjs.org/package/mazey-lazy-load-images
[l-image]: https://img.shields.io/npm/l/mazey-lazy-load-images
[l-url]: https://github.com/chengchuu/mazey-lazy-load-images

Lazy load images.

## Install

You can get mazey-lazy-load-images via [npm](https://www.npmjs.com/package/mazey-lazy-load-images).

```
npm install mazey-lazy-load-images --save
```

## Usage

```
import { lazyLoadImages } from 'mazey-lazy-load-images';

lazyLoadImages({
  images: [ // Data contains images.
    {
      name: 'Example1',
      img: [
        'https://i.mazey.net/icon/sizes/600x200.jpg',
        'https://i.mazey.net/icon/sizes/200x400.jpg',
        'https://i.mazey.net/icon/sizes/400x200.jpg',
        'https://i.mazey.net/icon/sizes/600x200.jpg',
        'https://i.mazey.net/icon/sizes/400x200.jpg',
        'https://i.mazey.net/icon/sizes/400x200.jpg',
      ]
    },
    {
      name: 'Example2',
      img: [
        'https://i.mazey.net/icon/sizes/800x600.jpg',
        'https://i.mazey.net/icon/sizes/800x600.jpg',
        'https://i.mazey.net/icon/sizes/200x400.jpg',
      ]
    },
  ],
  container: '.box', // A String can be used by `document.querySelector()`, such as: `.box` or `#entry-content`.
  defaultImg: 'https://i.mazey.net/icon/sizes/200x200.jpg', // Default load image.
});
```

DOM

```
<div class="box">
  <div class="m-box">
    
    <div>
      <div>
        <span>1. Example1</span>
      </div>
      <div class="m-img">
        
      <div><img src="https://i.mazey.net/icon/sizes/600x200.jpg" data-src="https://i.mazey.net/icon/sizes/600x200.jpg" class="m-img-item" loading="lazy"></div>
    
      <div><img src="https://i.mazey.net/icon/sizes/200x400.jpg" data-src="https://i.mazey.net/icon/sizes/200x400.jpg" class="m-img-item" loading="lazy"></div>
    
      <div><img src="https://i.mazey.net/icon/sizes/400x200.jpg" data-src="https://i.mazey.net/icon/sizes/400x200.jpg" class="m-img-item" loading="lazy"></div>
    
      <div><img src="https://i.mazey.net/icon/sizes/600x200.jpg" data-src="https://i.mazey.net/icon/sizes/600x200.jpg" class="m-img-item" loading="lazy"></div>
    
      <div><img src="https://i.mazey.net/icon/sizes/400x200.jpg" data-src="https://i.mazey.net/icon/sizes/400x200.jpg" class="m-img-item" loading="lazy"></div>
    
      <div><img src="https://i.mazey.net/icon/sizes/400x200.jpg" data-src="https://i.mazey.net/icon/sizes/400x200.jpg" class="m-img-item" loading="lazy"></div>
    
      </div>
    </div>
  
    <div>
      <div>
        <span>2. Example2</span>
      </div>
      <div class="m-img">
        
      <div><img src="https://i.mazey.net/icon/sizes/800x600.jpg" data-src="https://i.mazey.net/icon/sizes/800x600.jpg" class="m-img-item" loading="lazy"></div>
    
      <div><img src="https://i.mazey.net/icon/sizes/800x600.jpg" data-src="https://i.mazey.net/icon/sizes/800x600.jpg" class="m-img-item" loading="lazy"></div>
    
      <div><img src="https://i.mazey.net/icon/sizes/200x400.jpg" data-src="https://i.mazey.net/icon/sizes/200x400.jpg" class="m-img-item" loading="lazy"></div>
    
      </div>
    </div>
  
  </div>
</div>
```

## Contributing

```
# dev
npm run dev

# build
npm run build

# documentation
npm run docs
```
