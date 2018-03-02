require_relative '../android/base_page_object'

class TaxonScreen < BasePageObject
    def trait
      "ti.modules.titanium.ui.widget.webview.TiUIWebView$NonHTCWebView'"
    end
# query("ti.modules.titanium.ui.widget.webview.TiUIWebView$NonHTCWebView xpath:'//*[contains(text(),\"Scientific Classification:\")]/../text()'", :textContent)
  
end
