
const convertPrice = price => `AED ${price}.00`;

const Product = ({
  productId,
  productName,
  selectedItem,
  items
}) => {
  const item = items.find(({id}) => selectedItem === id);
  return (`
  <div class="product">
    <div class="product__image">
      <img class="product__image__source" src="${item.imageUrl}" alt=""/>
    </div>
    <div class="product__infos">
      <h3 class="product__infos__name">${productName}</h3>
      <div class="product__infos__sku-selector">${items.map(({id, className}) => (`
        <li 
          class="product__infos__sku-selector__color color-${className} ${id === selectedItem ? "product__infos__sku-selector__color--selected" : ""}"
          onclick="updateProducts(${productId}, ${id})"
          />
      `))}</div>
      <div class="product__infos__prices">
        ${item.listPrice && item.listPrice !== item.price ? `<p class="product__infos__prices__list-price">${convertPrice(item.listPrice)}</p>` : ""}
        <p class="product__infos__prices__price">${convertPrice(item.price)}</p>
      </div>
      <button onclick="addProductToCart({id:${item.id}, seller:'${item.sellerId}'})" class="product__infos__add-to-cart product__infos__add-to-cart--${item.id}">add to cart</button>
    </div>
  </div>
  `)
}

const ProductsSlider = () => {
  console.log("productsConverter(checkoutRecommendationsProductsData)", checkoutRecommendationsProductsData)
  const {title, products} = checkoutRecommendationsProductsData
  return (`
    <div class="product-title">${title}</div>
    <div class="product-slider">
      <button onclick="scrollSlider({toLeft:true})" class="product-slider__button product-slider__previous-button">
        <img class="product-slider__button__icon" src="https://motorolaimgrepo.vteximg.com.br/arquivos/checkout-slider-arrow-left.png" alt="left arrow"/>
      </button>
      <div class="product-slider__products">
        ${products.map((product) => Product(product)).join("")}
      </div>
      <button onclick="scrollSlider({toLeft:false})" class="product-slider__button product-slider__next-button">
        <img class="product-slider__button__icon" src="https://motorolaimgrepo.vteximg.com.br/arquivos/checkout-slider-arrow-right.png" alt="right arrow"/>
      </button>
    </div>
  `);
}

function addProductToCart ({id, quantity = 1, seller = "1"}) {
  const item = {
    id: id,
    quantity: quantity,
    seller: seller
  };

  document.querySelector(`.product__infos__add-to-cart--${id}`).innerHTML = "adding..."
  vtexjs.checkout.addToCart([item], null, 1)
  .done(() => {
    document.querySelector(`.product__infos__add-to-cart--${id}`).innerHTML = "add to cart"
  });
}
  
function renderProduct ({referenceElement, elementClassName}) {
  const element = document.createElement("div");
  element.innerHTML =  ProductsSlider();
  element.className = elementClassName;
  referenceElement.appendChild(element);
  grabToScroll()
}

function productsConverter (products) {
  return (
    {
      title: products[0].productClusters[productClusterRecommendationId],
      products: products.map(
        ({
          productId,
          productName,
          items
        }) => {
          const filteredItems = items.filter(({Color}) => !!Color).filter(({sellers}) => sellers.find(({sellerDefault}) => !!sellerDefault).commertialOffer.Price !== 0)
          if(filteredItems.length === 0) return null
          return ({
            productId: productId,
            selectedItem: filteredItems[0].itemId,
            productName: productName,
            items: filteredItems.map(({itemId, Color, images ,sellers}) => ({
                id: itemId,
                className: Color[0].toLowerCase().replaceAll(" ", "-"),
                imageUrl: images[0].imageUrl,
                listPrice: sellers.find(({sellerDefault}) => !!sellerDefault).commertialOffer.ListPrice,
                price: sellers.find(({sellerDefault}) => !!sellerDefault).commertialOffer.Price,
                sellerId: sellers.find(({sellerDefault}) => !!sellerDefault).sellerId,
              }
            ))
          })
        }
      ).filter(item => item)
    }
  )
};

function updateProducts(selectedProductId, selectedItem){
  const selectedProductIndex = checkoutRecommendationsProductsData.products.findIndex(({productId}) => productId === selectedProductId.toString());  
  checkoutRecommendationsProductsData.products[selectedProductIndex].selectedItem = selectedItem.toString()
  document.querySelector(".product-recommendations").innerHTML = ProductsSlider();
  grabToScroll()
  scrollSlider({absolutePosition:currentCheckoutRecommendationsProductSliderScroll})
}

function scrollSlider({toLeft, scrollDepth = 320, elementToScroll = document.querySelector(".product-slider__products"), absolutePosition}){
  if(absolutePosition !== undefined) {
    elementToScroll.scrollLeft = absolutePosition;
  } else {
    const currentScroll = elementToScroll.scrollLeft;
    const scrollTo = toLeft ?  - scrollDepth : + scrollDepth
    elementToScroll.scrollLeft = currentScroll + scrollTo
  }
}

function renderCheckoutRecomendations (''){
  const elementClassName = "product-recommendations"
  if(document.querySelector(`.${elementClassName}`)) return

  fetchCheckoutRecommendations({
    wrapperClassName: ".cart-template-holder",
    elementClassName: elementClassName
  })
};

function fetchCheckoutRecommendations ({wrapperClassName, elementClassName}) {
  if(!wrapperClassName) return;

  return fetch(`/api/catalog_system/pub/products/search?fq=productClusterIds:${productClusterRecommendationId}`)
  .then(data => data.json())
  .then(
    products => {
      checkoutRecommendationsProductsData = productsConverter(products);
      renderProduct({
        referenceElement: document.querySelector(wrapperClassName),
        elementClassName: elementClassName
      })
    }
  )
}

function grabToScroll() {
  const slider = document.querySelector('.product-slider__products');
  let isDown = false;
  let startX;
  let scrollLeft;

  slider.addEventListener('scroll', () => {
    currentCheckoutRecommendationsProductSliderScroll = slider.scrollLeft;
  })
  
  slider.addEventListener('mousedown', (e) => {
    isDown = true;
    slider.classList.add('active');
    startX = e.pageX - slider.offsetLeft;
    scrollLeft = slider.scrollLeft;
  });
  slider.addEventListener('mouseleave', () => {
    isDown = false;
    slider.classList.remove('active');
  });
  slider.addEventListener('mouseup', () => {
    isDown = false;
    slider.classList.remove('active');
  });
  slider.addEventListener('mousemove', (e) => {
    if(!isDown) return;
    e.preventDefault();
    const x = e.pageX - slider.offsetLeft;
    const walk = (x - startX) * 2; 
    slider.scrollLeft = scrollLeft - walk;
  });
}
