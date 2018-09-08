msharman@office-desktop:~/Projects/walta$ rake unit_test_node
NODE_PATH="./walta-app/app:./walta-app/app/lib" mocha --compilers js:babel-core/register walta-app/app/specs/CerdiApi_spec.js


  CerdiApi
REQUEST: {
    "client_secret": null,
    "scope": "create-users"
}
RESPONSE 401: {
    "error": "invalid_client",
    "message": "Client authentication failed"
}
    #obtainAccessToken
REQUEST: {
    "client_secret": "hWVKBp0PkCf87IiL2eATE3HjQv4DjYL4q7GsLfnz",
    "scope": "create-users"
}
RESPONSE 200: {
    "token_type": "Bearer",
    "expires_in": 31536000,
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6ImY5MDQ2Y2JjOWVjMWNjYmRjNmZkNDdiMGUzOGM4MzZmY2FiMDI3NGFkZjg5MGNmM2RmMzIzMWE4Y2ViMTY5M2ZhY2RjYzJiYzM0MGIxOTQ4In0.eyJhdWQiOiI1IiwianRpIjoiZjkwNDZjYmM5ZWMxY2NiZGM2ZmQ0N2IwZTM4YzgzNmZjYWIwMjc0YWRmODkwY2YzZGYzMjMxYThjZWIxNjkzZmFjZGNjMmJjMzQwYjE5NDgiLCJpYXQiOjE1MzY0MDMyOTIsIm5iZiI6MTUzNjQwMzI5MiwiZXhwIjoxNTY3OTM5MjkyLCJzdWIiOiIiLCJzY29wZXMiOlsiY3JlYXRlLXVzZXJzIl19.JSOG8K4bcoollkmTS1CDEWGXvNxO0zn6gNNP7VpRxjxMsHxwutklKSH1NCTINJ-SRQdSDEYWIkOYthuNUo2zqa1T0nsJ5gcuZ348e7ShTE1vi8hlynpUQ-zkIYHrru832HQqTTlvZZQR7UHC-kPen1v74oXivqfS9Vrq86y9RxuePPYWlB0JS1S-X_6WHFL17Vf3p6-a5GHQwW84oAlLXoZ59r2M3xsUDoYqRASwkRHJ09f_-VK-LmzjK2KCQWmhiiTHvjiAq45UFdPMTl2t9aVY2_Uu71C4FEIG_rjJfyVrS_Sbp_6dfagr3DSB6jyTtuRL8LxBO6kDHLlnx06tAfmKwqW2dEmsXwhTsuj4JWA-vbv4fBveJtmJygZShkVRIeAUEOxxA3ynokjCwy9aCjLpznGZ3xkISRym0y1xBdmYTISwVACpHcLkSFp6gF3JG7gHGJUgP4c3UhjVorUzNzz0cG6aVWtaNqYgYUvafAshboLDyTMQI5wvfgMuBr2rZ6YLx5ay55n2zvSorjvnM5r7Yu49PozllUHrmdzf8Pr-0vauwbtDtz4n7Ah9wt_9GSVdp_zf4V8r5XMKrA-D8noGQCJ8x2eZ2IN9xqNxKIJhqQafywb9ZyaSRWBrMYC4xK2MMavBhifKxu5Bw7laktHg8LBGjg-1gx7rZ0qHsSA"
}
      ✓ should obtain access token (312ms)
      token expiration
REQUEST: {
    "client_secret": "hWVKBp0PkCf87IiL2eATE3HjQv4DjYL4q7GsLfnz",
    "scope": "create-users"
}
RESPONSE 200: {
    "expires_in": 1,
    "access_token": "testtoken 1"
}
        ✓ should cache the previous value
REQUEST: {
    "client_secret": "hWVKBp0PkCf87IiL2eATE3HjQv4DjYL4q7GsLfnz",
    "scope": "create-users"
}
RESPONSE 200: {
    "expires_in": 1,
    "access_token": "testtoken 1"
}
REQUEST: {
    "client_secret": "hWVKBp0PkCf87IiL2eATE3HjQv4DjYL4q7GsLfnz",
    "scope": "create-users"
}
RESPONSE 200: {
    "expires_in": 1,
    "access_token": "testtoken 2"
}
        ✓ should renew the value after it has expired
    #registerUser
REQUEST: {
    "client_secret": "hWVKBp0PkCf87IiL2eATE3HjQv4DjYL4q7GsLfnz",
    "scope": "create-users"
}
RESPONSE 200: {
    "token_type": "Bearer",
    "expires_in": 31536000,
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6ImMxMTM3NTMxY2VmODVjYTMwMjkwZjNjODljZTAzNWZiMzQ3MzZlMWVlN2MxYWUwNDk4ODE2YzY3NDZjZDA3YjIxNDI1YTg5YTBmOTY0MTViIn0.eyJhdWQiOiI1IiwianRpIjoiYzExMzc1MzFjZWY4NWNhMzAyOTBmM2M4OWNlMDM1ZmIzNDczNmUxZWU3YzFhZTA0OTg4MTZjNjc0NmNkMDdiMjE0MjVhODlhMGY5NjQxNWIiLCJpYXQiOjE1MzY0MDMyOTMsIm5iZiI6MTUzNjQwMzI5MywiZXhwIjoxNTY3OTM5MjkzLCJzdWIiOiIiLCJzY29wZXMiOlsiY3JlYXRlLXVzZXJzIl19.oAzNPgfLe7kIs8E0dSF39thbeRxOw_kJQYktayiQ7wphVVzLlRSaL_rZaKbzSZ9gqXo4iroMwIoaT4LTN4eOO4Xbkt-ngQtT3HBewHSk8-iizEhfL3TH4QPcxNZTkiTbjq08JL5feN2t0JK0KCJA8lkP4mkEZwaKklIikuh1OJqUDEmhv-q49VJrC88-dMTZBiFfYnM0NqbEHVjrpBOg1c3XKG8VzVj6YbQNoAoNwJ-zw36TFqHuagVy71T0OXde8eg41cQG8Rh8rHW_wxa5Vgk_DryG2G08D5qkLBCuMgPwzNmGExiUPnKhr1Fd-gxMVVXYNavh1zQC50NfD4EvHRUvlcu2rwvqV-d5goFL3Mpu5CwnI2O6nsDRXkaSi0jzCLajSid3c669c2RxCUeRE02LcSOpO8fq4v11eqITTIpI5coDYAEzoyx814k8uqFzH47As5FP8iT48JjezuxQ_5-izeFZtail0PCoWLwbrmkFFbQ6QENVHWn7i68tZIsatddz-Rhfw8XwRGpAKhWOHaYuE6ITYEW3j-rl3nNQdSZDxZoJbu3aFhJckUQx2wUCzt3K8cZfVyqiGOOsYfqVb-ZlPgl_mJxQ3IZE3S3tASb1hr_Omucc2LTXB1Lgg8vqt2ay0Xt8fiUsl7pjftA6y185WFmtn06EsiWkVFf8op8"
}
REQUEST: {
    "email": "test-1536403292821@example.com",
    "group": false,
    "survey_consent": false,
    "share_name_consent": false,
    "name": "Test Example",
    "password": "tstPassw0rd!"
}
RESPONSE 201: {
    "name": "Test Example",
    "email": "test-1536403292821@example.com",
    "group": 0,
    "survey_consent": 0,
    "share_name_consent": 0,
    "oauth_network": null,
    "updated_at": "2018-09-08 10:41:33",
    "created_at": "2018-09-08 10:41:33",
    "id": 102,
    "accessToken": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6IjVkZTU2YTNlOTllMTRjMWIyODI2YTE0MTQyZDI0NjMwZDk1OTZjYzU5NTQ4ZTk0ZDk2MTQ2OGM5MGNmZTQyZWIzZmI2OTc1NWFmM2UzNDAzIn0.eyJhdWQiOiIzIiwianRpIjoiNWRlNTZhM2U5OWUxNGMxYjI4MjZhMTQxNDJkMjQ2MzBkOTU5NmNjNTk1NDhlOTRkOTYxNDY4YzkwY2ZlNDJlYjNmYjY5NzU1YWYzZTM0MDMiLCJpYXQiOjE1MzY0MDMyOTMsIm5iZiI6MTUzNjQwMzI5MywiZXhwIjoxNTY3OTM5MjkzLCJzdWIiOiIxMDIiLCJzY29wZXMiOltdfQ.lbOueGlN6ZiMOBU26TyWUczW2HOPqk8Sly3Qm3Ah9NeS9Y7cVt_vZ8YKF9FnOP0RwBUfuUKKK5jkxWDq7VBvK5jHrj7q3dD1hx8ymj_nJXifm67jL_dNiHNnYW_8e97FqCos2F3JhEycI4RqZLj0FQcVIWs5EZ4ltW97nZZSKVQ8gNxKPmW28k4iM70qLg-7AQdjndXQRA2_MhmAC5E09sc6Sg725LHHoUyczI1w3_9UD7h8KPzP9K8kUy9yYKK8xDBkjCJ2SvujZWk3LkUKPL0owR5YrexZvX90vXYU1lLlag3TizylTJDzN7TTYGJKebnftAiRHmMZlSjCX-JCF_t2WogkRE43KD747d6DAp7sWcljwEC30fBiAXi-5O6oTVdmIHKtlCxEpnGQnQt0IqWpUmLz1FS8UDRUUYXu6OsasjSjRCH61z4Q20voKJCqWwl8UexghQxTTkwIMmZQdtf3eNlORndTsqZ3YdV9zO3Mg8rn0MrTSsg8W2YE7rHVCJ1xuxa4_esZWWvPKVXgds1dxH-gNq40ps555hYtDKQG9Ql11FudOVGLdbvofja7FuF7jQwDrDxNBvySrXvcCUB_lW7EGcjDu4V7CMQ_7P816ec74XIrpRan-eb3EeQCHkyJ5xtW45s_vXLiz82MfY00WIcGa84pW-opKZ-a1cQ"
}
      ✓ should succesfully register a local user (764ms)
      - should succesfully register a social user
    #loginUser
REQUEST: {
    "client_secret": "hWVKBp0PkCf87IiL2eATE3HjQv4DjYL4q7GsLfnz",
    "scope": "create-users"
}
RESPONSE 200: {
    "token_type": "Bearer",
    "expires_in": 31536000,
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6ImM2NjUyOTRjYzM4M2VmNDcxMjM0ZDhmNDQyZmJiZGE5YzBiYjUwYzFiZTc0YzBiOGM1NzZiYWZjMzBlOGU1NzljZDQwNmEzMmEyNTc1Nzc0In0.eyJhdWQiOiI1IiwianRpIjoiYzY2NTI5NGNjMzgzZWY0NzEyMzRkOGY0NDJmYmJkYTljMGJiNTBjMWJlNzRjMGI4YzU3NmJhZmMzMGU4ZTU3OWNkNDA2YTMyYTI1NzU3NzQiLCJpYXQiOjE1MzY0MDMyOTMsIm5iZiI6MTUzNjQwMzI5MywiZXhwIjoxNTY3OTM5MjkzLCJzdWIiOiIiLCJzY29wZXMiOlsiY3JlYXRlLXVzZXJzIl19.dxiUa8q5Zm7u57_CQ3vkJGtloVzXlb8KFdSLGhXj3-cr02NwUG1uS0IS7ludSOWUIiwL4dpz2AFriRaRmGStUXE_a6G99MQbzZ5Gr66PWep-k_b9xv3gGfE6PBwk8jmutJv3MKCxJDr9qYWwOSjVxAGJTchoJklEKLX31QV2ylC7OqZaEVUaxYcDYz5XeoT1mbb6nDx0l6MNw87dt_79qrLOBYRzRPwYHNLjGUwXwOCrJOAROGRgll3_u_qLPpnfcLXxmzoV8-8piAep9B-n9B3rCISiINMe0Wak9ARNMYS_gReIVZMTLctV3xiplhJCyRWYhaGcr4PjQKyAq4bwv0sZuOR6GBVyUhh3h-IaS7_g9NQEENJ-jfRExEKEfJPPV3G3b72NQSRfXADNLfrhduQaN3tKqQxrcoC1IXT0X8N1YDbKinr7vmDkghQFINNvnPUq0nHuydHGWsSJ1Y4VibvJ-At8SmjAcxgxQzVmhSvp-1ZQkZ9h6_5AEGzSihWDxYQx3K85M_HOqPCAivofN-HXRs6mexcPvRcYFCApRWl506DwcwJwQUCGQ4MPcczqLO7KngEgDcH9P35UxrlZZgD9psuBBp9oCiQQSisHGqcHTIXYaVb5SmUBm_U8b4F2jcDctZc7yOxfeYnFGBBCYr4BNQn4lvcV8YfnNKjKn-U"
}
REQUEST: {
    "password": "badpassword",
    "email": "nonexistentuser@example.com"
}
RESPONSE 422: {
    "message": "The given data was invalid.",
    "errors": {
        "valid": [
            "incorrect user credentials"
        ]
    }
}
      ✓ should fail if a user doesn't exist (887ms)
REQUEST: {
    "client_secret": "hWVKBp0PkCf87IiL2eATE3HjQv4DjYL4q7GsLfnz",
    "scope": "create-users"
}
RESPONSE 200: {
    "token_type": "Bearer",
    "expires_in": 31536000,
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6ImIwNmY1MTEyYWY2MjU0MDczMzA5YzBmMDQ2YTg3OWFmMDRkMTgxZWNjYjU3MmU0NTQ5NDc4YzFkODhiMGYxYjAyYjk0Yjc5YTE0M2I0OTAwIn0.eyJhdWQiOiI1IiwianRpIjoiYjA2ZjUxMTJhZjYyNTQwNzMzMDljMGYwNDZhODc5YWYwNGQxODFlY2NiNTcyZTQ1NDk0NzhjMWQ4OGIwZjFiMDJiOTRiNzlhMTQzYjQ5MDAiLCJpYXQiOjE1MzY0MDMyOTUsIm5iZiI6MTUzNjQwMzI5NSwiZXhwIjoxNTY3OTM5Mjk1LCJzdWIiOiIiLCJzY29wZXMiOlsiY3JlYXRlLXVzZXJzIl19.hFzYpyofJ8WiK9kZtJwnpJEU6Qn9djKMdguciziylsJw61omHRmO9wylERBE04Q9E6J71doco-QGrlV1RcPd_CCPR2oKZn0HDLlCpsfVRNmR9VOHjnKriubOEfdhGB4xJO7ffYvzSX2CdbfrY2-UEmXRzdBY2FiR_ZX1l0gLXWGPK1kW6MIWQIK_5-tZXV0VI9clcNB0Pb_O8UyKGnaMKe3w9IupKiUSL8pb33X8uNVE2C8sTrSejPPb_1ES2CxCeVoWgqfHSRYnfCkNigjJJYnUqFkK-UwDwLWgKylBoaJlqqTwP5XAR--TvuCMzeWioQZm2S2xD0Np35gP0H0QYpyyEWzVONcyI4kfB_t0yoHQJVtZbk1AuhApgb3snLCDroVN3XqjFrNtHjtWczB47GQi3KIyvUfqmycGRhH6r21vsfioKK7I5yv7eYBZGsWuGA0TXKE3eXTr0WE0952fRAHLCKFjfxyt_MZFeqwqKbIkE1dl7Bn-M2YjbdETa0T1QBS9nF6WUET27dFl_q2N8ioAQ490d82LCczW26Jzlv1ebhOTnQjwfojEsERWn3sT3q13PIfvObtpv2Js7a9fmpXZu4reSCk2ExdqgUyLDOMcY6ieQXepCEhQf5zALQnOPlpxeXjxbJ821YPqx62CtBSaoxr2M6T7Zee3bo53iVU"
}
REQUEST: {
    "password": "badpassword",
    "email": "testlogin@example.com"
}
RESPONSE 422: {
    "message": "The given data was invalid.",
    "errors": {
        "valid": [
            "incorrect user credentials"
        ]
    }
}
      ✓ should fail if the password doesn't match (1018ms)
REQUEST: {
    "client_secret": "hWVKBp0PkCf87IiL2eATE3HjQv4DjYL4q7GsLfnz",
    "scope": "create-users"
}
RESPONSE 200: {
    "token_type": "Bearer",
    "expires_in": 31536000,
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6ImJlNWM3ZjE0ZjBjYWYxMTczNTdiYTlkMDU5NTYxZDhhNGRiNWM4MGIwOGZhYzI5ZTJkZjZkZTM1YmNkN2IzNzJmNDY2OTljMWNiMTgyYjcyIn0.eyJhdWQiOiI1IiwianRpIjoiYmU1YzdmMTRmMGNhZjExNzM1N2JhOWQwNTk1NjFkOGE0ZGI1YzgwYjA4ZmFjMjllMmRmNmRlMzViY2Q3YjM3MmY0NjY5OWMxY2IxODJiNzIiLCJpYXQiOjE1MzY0MDMyOTUsIm5iZiI6MTUzNjQwMzI5NSwiZXhwIjoxNTY3OTM5Mjk1LCJzdWIiOiIiLCJzY29wZXMiOlsiY3JlYXRlLXVzZXJzIl19.b1sJ-2Aq915cP6nM8q9RyqsDGyabh12sguTBG8AhZ9wVX7HRgsc1JkTfOfr4z2sOBOzoLndLlF7lYwIJWE_wAzrp_Hsy2yAKPaL_aQ7UQNrGz7Rhj7Q73UPW15xbAxdCK_8_5Q3SzwOAcgUnYbKdNsIbwwFSDv47ZaJ9aqsJmTgpl2OqJiG5ZsFWXTmejds_6Iv0RFKIUtbzmIMgjhnUywxbdEbwaguWIlXUn5C4tmqSHRkN170u35QcHLf86ZPUcjeZjl_gFSN5dPUJJfGLbiaKS2zMRhdblPuIqnkopNy05PErhG2GhyMDxuUVsMgH-wzpByRn_g7EY0NYnx3-KZoyXmZobbZ9AVx61dtS8SufQGIWNkCFHerIMHecBJTi2dgJyPTAFR2BzgCZ1ETxTno6NIbRMfgPJqY6AY2hmnVZOyjRkUYD1x7MMJm51puArGzOlYlGoupA8yY40kFJnSPECY3hvJVlf0Of-0glCPFauGswrOJuUskDRzflefsUuTOahqtm3boqIeuZPefy6OuC-kVAwRs1C1tTOI9VrcSuD7_cehmsZrZVlAZldDckdRgNlQgT0fGIKsDVZHezQonTgO-VmCRNojnDclcXwiNroPGjeA2DazwysvEqwuoGpAyj9qkUiPxeOchCHMNb1GirARbPbW2QPDpPvAC8nZw"
}
REQUEST: {
    "password": "tstPassw0rd!",
    "email": "testlogin@example.com"
}
RESPONSE 200: {
    "id": 38,
    "name": "Test Example",
    "email": "testlogin@example.com",
    "created_at": "2018-09-07 08:55:30",
    "updated_at": "2018-09-07 08:55:30",
    "group": 0,
    "survey_consent": 0,
    "share_name_consent": 0,
    "oauth_network": null,
    "accessToken": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6ImQ1MjViY2M3MzBiNjZhZGNmNDI0NDEyZjE3YmEzZDFkM2NjOGUxY2FkMTlhZjNiYzgwZjNiMDMyNTBkNWVkNjRmNzY3MmYxNjk1NjEzYjRlIn0.eyJhdWQiOiIzIiwianRpIjoiZDUyNWJjYzczMGI2NmFkY2Y0MjQ0MTJmMTdiYTNkMWQzY2M4ZTFjYWQxOWFmM2JjODBmM2IwMzI1MGQ1ZWQ2NGY3NjcyZjE2OTU2MTNiNGUiLCJpYXQiOjE1MzY0MDMyOTYsIm5iZiI6MTUzNjQwMzI5NiwiZXhwIjoxNTY3OTM5Mjk2LCJzdWIiOiIzOCIsInNjb3BlcyI6W119.o8WFkLbOFXERYYSiGsoAJpISOLtKkp30-U8V0Fn950K1-Y9i80-qN7OuyRcFKGbdSf78y8gNpw6dSFF0FCFw-I6tydjJ6ACDh9I2WoLusYlMNHK2DEIJiq1aDC78rNeqTWm1c43xbUgpwxAqKENGKPCigjMEkBbs5x9aWtzOinJDDNv1p8_KtKsLtieSHWBLjl8oWP5I3PB5E9eMgUZZ6xwNvcp-A4bf99CGCGIol2Nlci03LK-PoxMGbNoFd4sUAsXay0aVoAr-JUE0vLvJvwitkCl1j_oqOe_OMt5FWGp29-b5w7YoduiiVMoxno_pAS8-MhuGYDbvRjlnVnU9MO9i5WMykEbskyr8mJyRbhjJ-1x3vWDfXGjUHRWJh9mBDmV0SDG8N3WBCsjcNQwiTsVUmBs4ecTYE-u63G1JPCGuzSiN5MMqvZ0sNrujIw2SzR73RyQhwAaZufVz5VHCDzzmSjqWluRRe1jt4NH1xKjMdCuJdoiStP3XWacgQuqTlcNvGwrqJm0KjrayZgEKWDP-c7nhCe-dod-3kV4_vE5aheGSa6_WDoF51d_-cOpPySIJzgQUu_a39c5y8Qlffp5oHXi9sSgN5Ev_NqvLHANl3qGt8TXZpHNQpkrml4uOftPuV7IZHTndjwwPVmm9lNDXIumrt4UVfx2UyHBN01s"
}
      ✓ should log in an existing user (788ms)
    #submitSample
REQUEST: {
    "client_secret": "hWVKBp0PkCf87IiL2eATE3HjQv4DjYL4q7GsLfnz",
    "scope": "create-users"
}
RESPONSE 200: {
    "token_type": "Bearer",
    "expires_in": 31536000,
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6IjIwOTMzOGExM2JhNDA4OWNiYzliZTIwNzQ4N2ZhZTAwYTQwODU3NzM2NmVhODkyZThiZjJhNmVhNGE1YmYyNDY0Mzc5MzkyODNmNDBhN2ZjIn0.eyJhdWQiOiI1IiwianRpIjoiMjA5MzM4YTEzYmE0MDg5Y2JjOWJlMjA3NDg3ZmFlMDBhNDA4NTc3MzY2ZWE4OTJlOGJmMmE2ZWE0YTViZjI0NjQzNzkzOTI4M2Y0MGE3ZmMiLCJpYXQiOjE1MzY0MDMyOTYsIm5iZiI6MTUzNjQwMzI5NiwiZXhwIjoxNTY3OTM5Mjk2LCJzdWIiOiIiLCJzY29wZXMiOlsiY3JlYXRlLXVzZXJzIl19.iXC8qur9y9_p8idlUjwvGVaOZjheiRJJTcT9SlhSzSVFDYae0vxGJLZkECItsUTIJEsi38ne-6vGrKPDmfpUHVqQDmBmn6L9a70MxSep_BV_IfF8R_U4mSUPpbykWaGDFDAHrwUdVtpVP652OXvPF2HImmXVdYUEKCkyObpgE1XlPHQwffd8EvKOJ9Pl0gRF4w28oa1hetTAaPrYqD6KUtKZ5zbyVNLvLXTKK6F02ubzhr5Jd1uJdKUhZs2at8CxE8uX9sl06GK56IjbktLY9fsXZ2JSRhjbyF1FwbgE63hl-YgPfB6t1Kggkp5pX8FeAN3YleCNQ0q9xHhRZOAG1dHNQh4x55W6GsxIeeRx6qpN_u4XwBA6vXKA-z4XpIEcNOiHAbxNyYGvVMwNizkjerM-pWP9M7doBIjsmXU7PLEgMKpIzT_P_rF39_A6vVjEvGE5a-mqRSz4jc7FUoOz8I4G9fpxKsa_YGWzsgBIjGC1f136EDgavFY7jSl1lhp-xEv5tB-eEriO2WTB6l-qLnUEu0xHdPRpq0xabWPIS3VGrKFyEvbHc6bY2eYb6NenHXMieTtoqMKtCtUoAAqPv3jVkLXul5l6DLGFjCVCiHJC7PNJxRabZeAAX3uePusAnbPv6xuvIcgcGrJZXSJAKA14guefsefbslTrqFiV_qc"
}
REQUEST: {
    "password": "tstPassw0rd!",
    "email": "testlogin@example.com"
}
RESPONSE 200: {
    "id": 38,
    "name": "Test Example",
    "email": "testlogin@example.com",
    "created_at": "2018-09-07 08:55:30",
    "updated_at": "2018-09-07 08:55:30",
    "group": 0,
    "survey_consent": 0,
    "share_name_consent": 0,
    "oauth_network": null,
    "accessToken": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6ImM5MzdmNzViYjYyYjg3MzFlNDJlOTZmMWYwNGViODg4NzNmYTBkYWJlY2FlZmJlNTcwNjgyOTY4MjE4NWU3ZmQ5MzAxZjMyZTBhZmQ4YjlmIn0.eyJhdWQiOiIzIiwianRpIjoiYzkzN2Y3NWJiNjJiODczMWU0MmU5NmYxZjA0ZWI4ODg3M2ZhMGRhYmVjYWVmYmU1NzA2ODI5NjgyMTg1ZTdmZDkzMDFmMzJlMGFmZDhiOWYiLCJpYXQiOjE1MzY0MDMyOTYsIm5iZiI6MTUzNjQwMzI5NiwiZXhwIjoxNTY3OTM5Mjk2LCJzdWIiOiIzOCIsInNjb3BlcyI6W119.bEOcnzh2858nb5LmbJZNEU9Skucz-ukZC0uOqFvadcsT-0tOsUuZ8zOC5UznAV_v1qK9QNWhwN75pYJYRbexqCvCVNT5wyYtyTBzGaVTEKmMz-FVoLNe1EeDtRVJCvt5yowDCYANRRqjDfOhifUrdC7407bKkACnnpT39cp8jZ14Utjjq1KjdfW25n2FN7yY1168HXjT29MxyjkouR7eW7Chf0D_ZkSKm0yc0JwbXbd6TpYpInqCV-O_l-ZCCKU6Yx5aVTm8dC7e-gRVmkVgqwh8yZahYNW_HDbgN4YKH2TXTIo33ivYGQTaTwXhqurCFRBHbLhfbdmemby3N0tuvO4s7dCk9ho2yfvGl-bRfujb_jPyI2Cr-7n41g-GUGZoAhPqL641QpQvMYEKAPvoVrX8fPorsxa0xhIXIpGM7N-ytiHXThhtInvEqnhHreHnuA_Pvsn6ZmAAbqZk2J-LHqr8j3KYNsRIPUrbp9_S1GB-0I84Cio-R52wGm1eIuNByQYYJnpqUYe1yDGPTHFqB0W1RZLHLVOc_ru3PYn0BQmwojsr-wyRUCcezOfpGLDPB0DqXpVtfD1PiE_n9uL764KRI-F9y1dui4bdcIJn8w5gsIYMZnxsBAnmxvrIfdkJ9lt6i_O1Uv9LEI0xD1aL0NyeOyavuCOkkmPVhFy62ZE"
}
REQUEST: {
    "sample_date": "2018-09-08T20:41:37+10:00",
    "lat": "-37.5622",
    "lng": "143.87503",
    "scoring_method": "alt",
    "survey_type": "detailed",
    "waterbody_type": "river",
    "waterbody_name": "string",
    "nearby_feature": "string",
    "notes": "test sample",
    "habitat": {
        "boulder": 5,
        "gravel": 5,
        "sand_or_silt": 5,
        "leaf_packs": 5,
        "wood": 5,
        "aquatic_plants": 5,
        "open_water": 5,
        "edge_plants": 5
    },
    "creatures": [
        {
            "creature_id": 1,
            "count": 2,
            "photos_count": 0
        }
    ]
}
RESPONSE 201: {
    "sample_date": "2018-09-08T10:41:37+00:00",
    "lat": "-37.5622",
    "lng": "143.87503",
    "scoring_method": "alt",
    "survey_type": "detailed",
    "waterbody_type": "river",
    "waterbody_name": "string",
    "nearby_feature": "string",
    "notes": "test sample",
    "user_id": 38,
    "updated_at": "2018-09-08T10:41:37+00:00",
    "created_at": "2018-09-08T10:41:37+00:00",
    "id": 6,
    "score": 0,
    "weighted_score": null,
    "creatures": [
        {
            "id": 1,
            "phylum": "Arthropoda",
            "subphylum": "",
            "class": "",
            "order": "",
            "family": "",
            "genus": "",
            "species": "",
            "parent_id": 207,
            "alt_name": "Arthropoda",
            "alt_section": "1",
            "common_name": "",
            "taxonomic_level": "phylum",
            "ala_name": "",
            "rd_name": "",
            "ala_guid": null,
            "photos": [],
            "sampled_creature": {
                "sample_id": 6,
                "creature_id": 1,
                "count": 2
            }
        }
    ],
    "habitat": {
        "id": 6,
        "sample_id": 6,
        "boulder": 5,
        "gravel": 5,
        "sand_or_silt": 5,
        "leaf_packs": 5,
        "wood": 5,
        "aquatic_plants": 5,
        "open_water": 5,
        "edge_plants": 5
    }
}
      ✓ should submit a sample (1125ms)
