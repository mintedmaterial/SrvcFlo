import Scaffold from "@orderly.network/ui-scaffold";

<Scaffold
  mainNavProps={
    {
      // Please refer to the example code and configure as needed.
    }
  }
  footerProps={{}}
  routerAdapter={{
    onRouteChange, //Handle user click events on the navigation menu.
    currentPath: "/"
  }}
>
  {/* page component */}
  {children}
</Scaffold>;