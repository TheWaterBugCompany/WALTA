#! /bin/sh
cd /Users/msharman/Source/WALTA/walta-app/Pods
/Applications/Xcode.app/Contents/Developer/usr/bin/xcodebuild -configuration Debug -alltargets IPHONEOS_DEPLOYMENT_TARGET=10.0 -sdk iphoneos13.5 SYMROOT=/Users/msharman/Source/WALTA/walta-app/build/iphone/build/Products ONLY_ACTIVE_ARCH=NO
# cd /Users/msharman/Source/WALTA/walta-app/build/iphone
# DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer \
#     /Applications/Xcode.app/Contents/Developer/usr/bin/xcodebuild build -target Waterbug -configuration Debug \
#         -scheme Waterbug -derivedDataPath /Users/msharman/Source/WALTA/walta-app/build/iphone/DerivedData \
#         -UseNewBuildSystem=YES OBJROOT=/Users/msharman/Source/WALTA/walta-app/build/iphone/build/Intermediates \
#         SHARED_PRECOMPS_DIR=/Users/msharman/Source/WALTA/walta-app/build/iphone/build/Intermediates/PrecompiledHeaders \
#         SYMROOT=/Users/msharman/Source/WALTA/walta-app/build/iphone/build/Products \
#         "FRAMEWORK_SEARCH_PATHS=\$(inherited) \"\${PODS_CONFIGURATION_BUILD_DIR}/FirebaseCore\" 
#             \"\${PODS_CONFIGURATION_BUILD_DIR}/FirebaseCoreDiagnostics\" 
#             \"\${PODS_CONFIGURATION_BUILD_DIR}/FirebaseCrashlytics\" 
#             \"\${PODS_CONFIGURATION_BUILD_DIR}/FirebaseInstallations\" 
#             \"\${PODS_CONFIGURATION_BUILD_DIR}/GoogleDataTransport\" 
#             \"\${PODS_CONFIGURATION_BUILD_DIR}/GoogleDataTransportCCTSupport\" 
#             \"\${PODS_CONFIGURATION_BUILD_DIR}/GoogleUtilities\" 
#             \"\${PODS_CONFIGURATION_BUILD_DIR}/PromisesObjC\" 
#             \"\${PODS_CONFIGURATION_BUILD_DIR}/nanopb\" 
#             \"\${PODS_ROOT}/FirebaseAnalytics/Frameworks\" 
#             \"\${PODS_ROOT}/GoogleAppMeasurement/Frameworks\"" \
#         "GCC_PREPROCESSOR_DEFINITIONS=\$(inherited) COCOAPODS=1 \$(inherited) PB_FIELD_32BIT=1 PB_NO_PACKED_STRUCTS=1 PB_ENABLE_MALLOC=1" \
#         "HEADER_SEARCH_PATHS=\$(inherited) \"\${PODS_CONFIGURATION_BUILD_DIR}/FirebaseCore/FirebaseCore.framework/Headers\" 
#             \"\${PODS_CONFIGURATION_BUILD_DIR}/FirebaseCoreDiagnostics/FirebaseCoreDiagnostics.framework/Headers\" 
#             \"\${PODS_CONFIGURATION_BUILD_DIR}/FirebaseCrashlytics/FirebaseCrashlytics.framework/Headers\" 
#             \"\${PODS_CONFIGURATION_BUILD_DIR}/FirebaseInstallations/FirebaseInstallations.framework/Headers\" 
#             \"\${PODS_CONFIGURATION_BUILD_DIR}/GoogleDataTransport/GoogleDataTransport.framework/Headers\" 
#             \"\${PODS_CONFIGURATION_BUILD_DIR}/GoogleDataTransportCCTSupport/GoogleDataTransportCCTSupport.framework/Headers\" 
#             \"\${PODS_CONFIGURATION_BUILD_DIR}/GoogleUtilities/GoogleUtilities.framework/Headers\"  
#             \"\${PODS_CONFIGURATION_BUILD_DIR}/PromisesObjC/FBLPromises.framework/Headers\" 
#             \"\${PODS_CONFIGURATION_BUILD_DIR}/nanopb/nanopb.framework/Headers\" 
#             \"\${PODS_ROOT}/Headers/Public\" \"\${PODS_ROOT}/Headers/Public/Firebase\" 
#             \"\${PODS_ROOT}/Headers/Public/FirebaseAnalyticsInterop\" 
#             \"\${PODS_ROOT}/Headers/Public/FirebaseCoreDiagnosticsInterop\" \$(inherited) \${PODS_ROOT}/Firebase/CoreOnly/Sources 
#             \"\${PODS_TARGET_SRCROOT}/Sources/FBLPromises/include\"" \
#         "LD_RUNPATH_SEARCH_PATHS=\$(inherited) '@executable_path/Frameworks' '@loader_path/Frameworks'" \
#         "HYPERLOOP_LDFLAGS=\$(inherited) -ObjC -l\"c++\" -l\"sqlite3\" -l\"z\" -framework \"CoreTelephony\" 
#             -framework \"FBLPromises\" -framework \"FIRAnalyticsConnector\" -framework \"FirebaseAnalytics\" 
#             -framework \"FirebaseCore\" -framework \"FirebaseCoreDiagnostics\" -framework \"FirebaseCrashlytics\" 
#             -framework \"FirebaseInstallations\" -framework \"Foundation\" -framework \"GoogleAppMeasurement\" 
#             -framework \"GoogleDataTransport\" -framework \"GoogleDataTransportCCTSupport\" -framework \"GoogleUtilities\" 
#             -framework \"Security\" -framework \"StoreKit\" -framework \"SystemConfiguration\" -framework \"UIKit\" 
#             -framework \"nanopb\"" \
#         "PODS_BUILD_DIR=\${BUILD_DIR}" \
#         "PODS_CONFIGURATION_BUILD_DIR=\${PODS_BUILD_DIR}/\$(CONFIGURATION)\$(EFFECTIVE_PLATFORM_NAME)" \
#         "PODS_PODFILE_DIR_PATH=\${SRCROOT}/." \
#         "PODS_ROOT=/Users/msharman/Source/WALTA/walta-app/Pods" \
#         "USE_RECURSIVE_SCRIPT_INPUTS_IN_SCRIPT_PHASES=YES" \
#         "APPC_PROJECT_DIR=/Users/msharman/Source/WALTA/walta-app"