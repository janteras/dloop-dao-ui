const AppFooter = () => {
  const links = [
    { name: "Whitepaper", url: "https://d-loop.io/uploads/d-loop-whitepaper.pdf" },
    { name: "Medium", url: "https://medium.com/@d-loop" },
    { name: "Twitter", url: "https://twitter.com/dloopDAO" },
    { name: "LinkedIn", url: "https://linkedin.com/company/d-loop-io" },
    { name: "Github", url: "https://github.com/d-loopDAO" },
  ];

  return (
    <footer className="border-t border-dark-gray py-8 mt-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-6 md:mb-0">
            <svg 
              width="32" 
              height="32" 
              viewBox="0 0 100 100" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              className="text-accent"
            >
              <path 
                d="M50 10C27.909 10 10 27.909 10 50C10 72.091 27.909 90 50 90C72.091 90 90 72.091 90 50C90 27.909 72.091 10 50 10ZM50 20C66.569 20 80 33.431 80 50C80 66.569 66.569 80 50 80C33.431 80 20 66.569 20 50C20 33.431 33.431 20 50 20Z" 
                fill="currentColor"
              />
              <path 
                d="M65 35C57.268 35 51 41.268 51 49C51 56.732 57.268 63 65 63C72.732 63 79 56.732 79 49C79 41.268 72.732 35 65 35Z" 
                fill="currentColor"
              />
            </svg>
            <span className="ml-3 text-xl font-semibold text-white">d-loop</span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6">
            {links.map((link) => (
              <a 
                key={link.name}
                href={link.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-gray hover:text-accent transition-colors"
              >
                {link.name}
              </a>
            ))}
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-dark-gray text-center text-gray text-sm">
          <p>© {new Date().getFullYear()} d-loop DAO. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default AppFooter;
