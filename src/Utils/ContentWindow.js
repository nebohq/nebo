const getWindow = () => {
  if (typeof window === 'undefined') {
    return {
      location: { origin: null },
      localStorage: {
        getItem: () => null,
        setItem: () => null,
      },
      matchMedia: () => ({ matches: false, addEventListener: () => {} }),
    };
  }
  return window;
};

const ContentWindow = getWindow();
export default ContentWindow;
