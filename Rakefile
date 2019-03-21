# Set the following environment variables:
# ENV['KEYSTORE'] = '/home/msharman/Documents/Business/thecodesharman.keystore'
# ENV['KEYSTORE_PASSWORD'] = '*********'
# ENV['KEYSTORE_SUBKEY'] = 'thecodesharman'
# ENV['AVD_NAME'] = 'Nexus7'
# run calabash-android setup to set keystore also
ENV['APP_ID'] = 'net.thewaterbug.waterbug'

titanium_source_files = Rake::FileList.new("walta-app") do |fl|
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
  " --deploy-type production --target dist-playstore --keystore ${KEYSTORE} "\
    "--store-password ${KEYSTORE_PASSWORD} "\
    "--alias ${KEYSTORE_SUBKEY} "\
    "--output-dir walta-app/dist")
end

file 'walta-app/build/android/bin/Waterbug.apk' => titanium_source_files do
  sh("appc ti build --project-dir walta-app --build-only --platform android "\
    " --deploy-type development --keystore ${KEYSTORE} "\
    "--store-password ${KEYSTORE_PASSWORD} "\
    "--alias ${KEYSTORE_SUBKEY} ")
end

task :build do 
  sh("appc ti build --project-dir walta-app --build-only --platform android --deploy-type development")
end

task :start_emulator do
  sh("emulator -avd ${AVD_NAME} && adb -avd ${AVD_NAME} -e shell rm -rf /mnt/sdcard/* &")
end

task :uninstall_app do
  sh("adb uninstall ${APP_ID}")
end

task :test => [ :start_emulator, 'walta-app/build/android/bin/Waterbug.apk', :uninstall_app ] do
  
  sh("calabash-android run walta-app/build/android/bin/Waterbug.apk features/registration.feature --tags @only")
end

task :test_console => [:start_emulator, 'walta-app/build/android/bin/Waterbug.apk', :uninstall_app  ] do
  sh("calabash-android console walta-app/build/android/bin/Waterbug.apk features/submit_sample.feature")
end

task :unit_test  => [ :start_emulator ] do
  sh("appc ti build --project-dir walta-app --target emulator --device-id ${AVD_NAME} --liveview --platform android "\
    "--deploy-type development")
end

task :unit_test_node do
  sh("NODE_PATH=\"./walta-app/app:./walta-app/app/lib\" mocha --compilers js:babel-core/register walta-app/app/specs/CerdiApi_spec.js")
end

task :clean do
  sh("rm -rf walta-app/build/* && rm -rf walta-app/dist/* && rm -rf walta-app/Resources/*")
end

task :debug => [ :start_emulator, :uninstall_app ] do
  sh("appc ti build --project-dir walta-app --platform android --target emulator --device-id ${AVD_NAME} --debug-host /127.0.0.1:38331")
end

task :preview_android => [ ] do
  sh("appc ti build  --project-dir walta-app --platform android --deploy-type development --liveview --target emulator --device-id ${AVD_NAME}")
end

# iphone 6s =      AEA9B0BA-8715-4029-AE8A-1CAFE77653E1
# iphone 6s plus = E99CE79B-97BF-49B8-9357-C3DFE5611EF2
# iphone 5s =      C03480F3-D5A7-4444-A1FA-1CA9AF7D9861
# ipad mini =      85EDE93D-CFEA-40F5-8CD7-ED2556D9472F
task :preview_ios => [] do
  sh("appc ti build --project-dir walta-app --platform ios --deploy-type development --target simulator --liveview --device-id \"AEA9B0BA-8715-4029-AE8A-1CAFE77653E1\"")
end

task :device_preview_android => [] do
  sh("appc ti build --force --project-dir walta-app --platform android --deploy-type development --target device")
end

task :device_preview_ios => [] do
  sh("appc ti build --project-dir walta-app --platform ios --deploy-type development --target device")
end

task :release_ios => [ 'clean' ] do
  sh("appc ti build --project-dir walta-app --build-only --platform ios -R  \"Michael Sharman (6RRED3LUUV)\" -P \"e2935a1f-0c22-4716-8020-b61024ce143f\" --target dist-appstore --output-dir release");
end

task :release_android => [ 'clean' ] do
  sh("appc ti build --project-dir walta-app --build-only --platform android  --target dist-playstore --keystore ${KEYSTORE} --store-password ${KEYSTORE_PASSWORD} --alias ${KEYSTORE_SUBKEY} --output-dir release");
end
