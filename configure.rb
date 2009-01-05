use Rack::Session::Cookie, :expire_after => (60*60) # 1 hour

configure do
#  enable :sessions
  
  module RFC822
    EmailAddress = begin
      qtext = '[^\\x0d\\x22\\x5c\\x80-\\xff]'
      dtext = '[^\\x0d\\x5b-\\x5d\\x80-\\xff]'
      atom = '[^\\x00-\\x20\\x22\\x28\\x29\\x2c\\x2e\\x3a-' +
      '\\x3c\\x3e\\x40\\x5b-\\x5d\\x7f-\\xff]+'
      quoted_pair = '\\x5c[\\x00-\\x7f]'
      domain_literal = "\\x5b(?:#{dtext}|#{quoted_pair})*\\x5d"
      quoted_string = "\\x22(?:#{qtext}|#{quoted_pair})*\\x22"
      domain_ref = atom
      sub_domain = "(?:#{domain_ref}|#{domain_literal})"
      word = "(?:#{atom}|#{quoted_string})"
      domain = "#{sub_domain}(?:\\x2e#{sub_domain})*"
      local_part = "#{word}(?:\\x2e#{word})*"
      addr_spec = "#{local_part}\\x40#{domain}"
      pattern = /\A#{addr_spec}\z/
    end
  end

  CouchRest::Model.default_database = CouchRest.database!('http://localhost:5984/sovereign')
end

class Array
  def sum
    inject {|sum, n| sum + (n || 0)} || 0
  end

  # Sum two numeric arrays
  def add(other_array)
    raise ArgumentError unless other_array.is_a? Array
    (length > other_array.length ? zip(other_array) : other_array.zip(self)).collect(&:sum)
  end
end