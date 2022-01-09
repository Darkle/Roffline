describe('Login Page', function () {
  beforeEach(function () {
    cy.logout()
    cy.visit('/login')
  })

  it('Not logged in redirects to login page', function () {
    cy.visit('/')
    cy.location('pathname').should('eq', '/login')

    cy.visit('/sub-management')
    cy.location('pathname').should('eq', '/login')

    cy.visit('/settings')
    cy.location('pathname').should('eq', '/login')
  })

  it('validates login page html and text', function () {
    cy.title().should('eq', 'Roffline - Login')

    cy.get('form').contains(`Roffline doesn't use passwords, but rather unique usernames.`)
    cy.get('form').contains(`Copy the username below & save it. Then click the signup button.`)
    cy.get('h1').contains('Roffline Login').should('exist')
    cy.get('a').contains('Login').should('exist')
    cy.get('a').contains('Sign Up').should('exist')
    cy.get('button').contains('Login').should('exist')
    cy.get('button').contains('Sign Up').should('exist')
    cy.get('.login-form input[name="csrfToken"]').should('exist')
    cy.get('.login-form input[name="csrfToken"]').should($input =>
      expect($input.attr('value').length).to.be.above(5)
    )
    cy.get('.signup-form input[name="csrfToken"]').should('exist')
    cy.get('.signup-form input[name="csrfToken"]').should($input =>
      expect($input.attr('value').length).to.be.above(5)
    )
    cy.get('.login-form input[type="text"]').should('exist')
    cy.get('.login-form input[type="text"]').should('have.attr', 'placeholder', 'Username')
    cy.get('.signup-form input[type="text"]').should('exist')
    cy.get('pre').should($pre => expect($pre.text().trim().length).to.be.above(5))
    cy.get('.copy-to-clipboard-button').should('exist')
  })

  // Cant really do this test as would need https in order to read the clipboard with the clipboard api
  // it('should copy new username to clipboard when click on button to do so', function () {})

  it('should show different tab when you click on another tab', function () {
    cy.get('.login-form').then($loginForm => {
      expect($loginForm.is(':visible')).to.be.true
    })
    cy.get('.signup-form').then($signUp => {
      expect($signUp.is(':visible')).to.be.false
    })
    cy.get('.signup-form').should('have.class', 'is-hidden')

    cy.get('a').contains('Sign Up').click()

    cy.get('.login-form').then($loginForm => {
      expect($loginForm.is(':visible')).to.be.false
    })
    cy.get('.login-form').should('have.class', 'is-hidden')
    cy.get('.signup-form').then($signUp => {
      expect($signUp.is(':visible')).to.be.true
    })

    cy.get('a').contains('Login').click()

    cy.get('.login-form').then($loginForm => {
      expect($loginForm.is(':visible')).to.be.true
    })
    cy.get('.signup-form').then($signUp => {
      expect($signUp.is(':visible')).to.be.false
    })
    cy.get('.signup-form').should('have.class', 'is-hidden')
  })

  it('should generate a different username on each page load', function () {
    let firstGeneratedUsername = ''

    cy.get('pre').then($pre => {
      firstGeneratedUsername = $pre.text().trim()
    })

    cy.visit('/login')

    cy.get('pre').then($pre => {
      expect(firstGeneratedUsername).to.not.equal($pre.text().trim())
    })
  })

  it('should login with new or existing user when click on login button', function () {
    cy.getCookie('loggedInUser').then(cookie => {
      expect(cookie).to.be.null
    })

    cy.get('a').contains('Sign Up').click()

    cy.get('pre').then($pre => {
      const newUserUsername = $pre.text().trim()

      cy.get('button').contains('Sign Up').click()

      cy.location('pathname').should('eq', '/')

      cy.getCookie('loggedInUser').then(cookie => {
        expect(decodeURIComponent(cookie.value)).to.equal(newUserUsername)
      })

      cy.logout()

      cy.visit('/login')

      cy.getCookie('loggedInUser').then(cookie => {
        expect(cookie).to.be.null
      })

      cy.get('input[placeholder="Username"]').then($input => {
        $input.val(newUserUsername)
      })

      cy.get('button').contains('Login').click()

      cy.location('pathname').should('eq', '/')

      cy.getCookie('loggedInUser').then(cookie => {
        expect(cookie.value).to.equal(newUserUsername)
      })

      // Remove user we just created
      cy.DB('DELETE FROM users WHERE name = ?', newUserUsername)
    })
  })

  it('should login with new or existing user when press enter', function () {
    cy.getCookie('loggedInUser').then(cookie => {
      expect(cookie).to.be.null
    })

    cy.get('a').contains('Sign Up').click()

    cy.get('pre').then($pre => {
      const newUserUsername = $pre.text().trim()

      cy.get('button').contains('Sign Up').focus().type('{enter}')

      cy.location('pathname').should('eq', '/')

      cy.getCookie('loggedInUser').then(cookie => {
        expect(decodeURIComponent(cookie.value)).to.equal(newUserUsername)
      })

      cy.logout()

      cy.visit('/login')

      cy.getCookie('loggedInUser').then(cookie => {
        expect(cookie).to.be.null
      })

      cy.get('input[placeholder="Username"]').then($input => {
        $input.val(newUserUsername)
      })

      cy.get('button').contains('Login').focus().type('{enter}')

      cy.location('pathname').should('eq', '/')

      cy.getCookie('loggedInUser').then(cookie => {
        expect(cookie.value).to.equal(newUserUsername)
      })

      // Remove user we just created
      cy.DB('DELETE FROM users WHERE name = ?', newUserUsername)
    })
  })

  it.only('should send the correct form data on submit', function () {
    let newUserUsername = ''
    let csrfToken1 = ''

    cy.intercept('POST', '/api/create-user').as('createdUser')

    cy.get('a').contains('Sign Up').click()

    cy.get('input[name="csrfToken"]').then($input => {
      csrfToken1 = $input.val()
    })

    cy.get('pre').then($pre => {
      newUserUsername = $pre.text().trim()
    })

    cy.get('button').contains('Sign Up').click()

    cy.wait('@createdUser').then(({ request }) => {
      const reqBody = request.body

      expect(reqBody.length).to.be.above(0)

      const url = new URL(`${request.url}?${reqBody}`)
      cy.task('log', 'url', { hello: 'asd' })
      throw new Error('here')
      // expect(url.urlSearchParams.has('csrfToken')).to.be.true
      // expect(url.urlSearchParams.get('csrfToken')).to.equal(csrfToken1)

      // expect(url.urlSearchParams.has('signupUsername')).to.be.true
      // expect(url.urlSearchParams.get('signupUsername')).to.equal(newUserUsername)
    })

    // cy.get('pre').then($pre => {
    //   const newUserUsername = $pre.text().trim()

    //   cy.get('button').contains('Sign Up').click()

    //   cy.logout()

    //   cy.visit('/login')

    //   cy.getCookie('loggedInUser').then(cookie => {
    //     expect(cookie).to.be.null
    //   })

    //   cy.get('input[placeholder="Username"]').then($input => {
    //     $input.val(newUserUsername)
    //   })

    //   cy.get('button').contains('Login').click()

    //   cy.getCookie('loggedInUser').then(cookie => {
    //     expect(cookie.value).to.equal(newUserUsername)
    //   })
    // })
  })

  it('should show an error message if user not found when trying to log in', function () {
    cy.get('input[placeholder="Username"]').type('asd')

    cy.get('button').contains('Login').click()

    cy.get('span').contains('Error logging in. User ').should('exist')
    cy.get('code').should($code => expect($code.text().trim()).to.equal('asd'))
    cy.get('span').contains(' not found').should('exist')
  })

  it('should not have a cookie after visited logged out route', function () {
    cy.get('a').contains('Sign Up').click()

    cy.get('pre').then($pre => {
      const newUserUsername = $pre.text().trim()

      cy.get('button').contains('Sign Up').click()

      cy.getCookie('loggedInUser').then(cookie => {
        expect(decodeURIComponent(cookie.value)).to.equal(newUserUsername)
      })

      cy.visit('/logout')

      cy.visit('/')

      cy.getCookie('loggedInUser').then(cookie => {
        expect(cookie).to.be.null
      })

      // Remove user we just created
      cy.DB('DELETE FROM users WHERE name = ?', newUserUsername)
    })
  })
})
