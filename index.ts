import DiscoPeer from './src/services/disco'

window.disco = new DiscoPeer({
  rootNode: 'OBEY',
  events: {
    onReady: () => {},
    onObserving: (path) => {},
    onAnnounce: () => {}
  }
})
