import { Fragment } from 'react';
import { Menu, Transition, Switch } from '@headlessui/react';
import { Settings, Music, Play } from 'lucide-react';
import { useGame } from '../contexts/GameContext';

export default function SettingsDropdown() {
  const { settings, updateSettings } = useGame();

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="modern-button p-3 flex items-center justify-center">
          <Settings className="h-5 w-5" aria-hidden="true" />
        </Menu.Button>
      </div>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-150"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items 
          anchor="bottom"
          className="w-[calc(100vw-2rem)] max-w-80 md:w-96 md:max-w-none dropdown-menu focus:outline-none z-[100] mt-2 !left-1/2 !-translate-x-1/2"
        >
          <div className="p-4 md:p-6">
            <div className="flex items-center gap-3 mb-4 md:mb-6">
              <Settings className="h-5 w-5 md:h-6 md:w-6 text-blue-400" />
              <h3 className="eb-garamond-title text-lg md:text-xl text-white">Game Settings</h3>
            </div>
            
            <div className="space-y-4 md:space-y-6">
              <Menu.Item>
                {({ active }) => (
                  <div className={`player-card p-3 md:p-4 ${active ? 'scale-[1.02]' : ''} transition-transform`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-purple-400 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <Music className="w-4 h-4 md:w-5 md:h-5 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-white font-bold text-sm md:text-lg block truncate">Game Jingle</span>
                          <p className="text-gray-400 text-xs md:text-sm font-medium truncate">Play sound at round start</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.jingleEnabled}
                        onChange={(checked) => updateSettings({ jingleEnabled: checked })}
                        className={`${
                          settings.jingleEnabled ? 'bg-gradient-to-r from-green-400 to-green-500' : 'bg-gray-600'
                        } relative inline-flex h-5 w-9 md:h-6 md:w-11 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-transparent flex-shrink-0 ml-2`}
                      >
                        <span className="sr-only">Enable game jingle</span>
                        <span
                          className={`${
                            settings.jingleEnabled ? 'translate-x-5 md:translate-x-6' : 'translate-x-1'
                          } inline-block h-3 w-3 md:h-4 md:w-4 transform rounded-full bg-white transition-transform duration-300 shadow-lg`}
                        />
                      </Switch>
                    </div>
                  </div>
                )}
              </Menu.Item>
              
              <Menu.Item>
                {({ active }) => (
                  <div className={`player-card p-3 md:p-4 ${active ? 'scale-[1.02]' : ''} transition-transform`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <Play className="w-4 h-4 md:w-5 md:h-5 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-white font-bold text-sm md:text-lg block truncate">Auto Play</span>
                          <p className="text-gray-400 text-xs md:text-sm font-medium truncate">Start original sample automatically</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.autoPlayEnabled}
                        onChange={(checked) => updateSettings({ autoPlayEnabled: checked })}
                        className={`${
                          settings.autoPlayEnabled ? 'bg-gradient-to-r from-orange-400 to-red-500' : 'bg-gray-600'
                        } relative inline-flex h-5 w-9 md:h-6 md:w-11 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 focus:ring-offset-transparent flex-shrink-0 ml-2`}
                      >
                        <span className="sr-only">Enable auto play original sample</span>
                        <span
                          className={`${
                            settings.autoPlayEnabled ? 'translate-x-5 md:translate-x-6' : 'translate-x-1'
                          } inline-block h-3 w-3 md:h-4 md:w-4 transform rounded-full bg-white transition-transform duration-300 shadow-lg`}
                        />
                      </Switch>
                    </div>
                  </div>
                )}
              </Menu.Item>
            </div>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
} 