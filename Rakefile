# Set the following environment variables:
# ENV['KEYSTORE'] = '/home/msharman/Documents/Business/thecodesharman.keystore'
# ENV['KEYSTORE_PASSWORD'] = '*********'
# ENV['KEYSTORE_SUBKEY'] = 'thecodesharman'
# ENV['AVD_NAME'] = 'Nexus7'
ENV['APP_ID'] = 'net.thewaterbug.waterbug'

titanium_source_files = Rake::FileList.new("walta-app/**") do |fl|
  fl.exclude("walta-app/build")
  fl.exclude("walta-app/dist")
  fl.exclude("walta-app/COPYING")
  fl.exclude("walta-app/.gitignore")
  fl.exclude("walta-app/.project")
  fl.exclude("walta-app/.settings")
end

task default: 'test'

file 'walta-app/dist/Waterbug.apk' => titanium_source_files do
  sh("appc ti build --project-dir walta-app --build-only --platform android "\
     " --target dist-playstore --keystore ${KEYSTORE} "\
     "--store-password ${KEYSTORE_PASSWORD} "\
     "--alias ${KEYSTORE_SUBKEY} "\
     "--output-dir walta-app/dist")
end

task :start_emulator do
  sh("emulator -avd ${AVD_NAME} &")
end

task :uninstall_app do
  sh("adb uninstall ${APP_ID}")
end

task :test => [ :start_emulator, 'walta-app/dist/Waterbug.apk', :uninstall_app ] do
  sh("calabash-android run walta-app/dist/Waterbug.apk features/identify_taxa.feature")
end

task :test_console => [ :start_emulator, 'walta-app/dist/Waterbug.apk', :uninstall_app ] do
  sh("calabash-android console walta-app/dist/Waterbug.apk features/identify_taxa.feature")
end

task :clean do
  sh("rm -rf walta-app/build/* && rm -rf walta-app/dist/*")
end

task :preview => [ :start_emulator, :uninstall_app ] do
  sh("appc ti build --project-dir walta-app --platform android --target emulator --liveview")
end
